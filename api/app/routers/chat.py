"""
Chat routes — AI CSR and conversation logging.
"""
import json
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app import escalation_summary
from app.csr_ai import csr_response_ai
from app.deps import require_staff
from app.rate_limit import check_rate_limit
from app.config import CSR_RATE_LIMIT_MAX, CSR_RATE_LIMIT_WINDOW_SECONDS

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _client_ip(request: Request) -> str:
    # Railway terminates TLS in front of the app and forwards the real
    # client address via X-Forwarded-For; request.client.host alone would
    # just be the proxy's address in production.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/csr")
def csr_chat(payload: dict, background_tasks: BackgroundTasks, request: Request, db: Session = Depends(get_db)):
    """AI CSR — first response before human joins. Public, unauthenticated,
    and therefore rate-limited per client IP (see rate_limit.py) since
    it's the one AI surface a stranger can hit directly."""
    allowed, retry_after = check_rate_limit(
        f"csr:{_client_ip(request)}", CSR_RATE_LIMIT_MAX, CSR_RATE_LIMIT_WINDOW_SECONDS
    )
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="You're sending messages a bit fast — please wait a moment and try again.",
            headers={"Retry-After": str(retry_after)},
        )

    message = payload.get("message", "")
    session_id = payload.get("session_id", "default")
    history = payload.get("history", [])

    result = csr_response_ai(message, history)
    escalate = result.get("escalate", False)

    # Log the interaction
    interaction = models.AiInteraction(
        session_id=session_id,
        user_type="visitor",
        channel="web",
        messages=json.dumps([*history, {"role": "user", "content": message}, {"role": "assistant", "content": result["response"]}]),
        ai_summary=result.get("response"),
        escalated=escalate,
    )
    db.add(interaction)

    # `escalate` used to be logged on AiInteraction and never read by
    # anything — no admin UI surfaced it, so a genuinely frustrated
    # visitor's conversation just silently sat in a table nobody looked
    # at. This creates a real Escalation row so it actually reaches the
    # Dashboard's escalations alert. client_id/lead_id are null: an
    # anonymous website visitor isn't either yet.
    if escalate:
        transcript_lines = [f"{m.get('role', 'user')}: {m.get('content', '')}" for m in history]
        transcript_lines.append(f"user: {message}")
        esc = models.Escalation(
            source="csr_widget",
            client_id=None,
            lead_id=None,
            session_id=session_id,
            summary=message[:300],
            transcript="\n".join(transcript_lines)[-4000:],
            reason=f"Visitor flagged during a {result.get('intent', 'general_inquiry')} conversation",
            sentiment="negative",
            status="queued",
        )
        db.add(esc)
        db.flush()  # assign esc.id before the background task needs to look it up
        background_tasks.add_task(escalation_summary.summarize_and_save_background, esc.id)

    db.commit()

    return {
        "response": result["response"],
        "intent": result.get("intent", "general_inquiry"),
        "escalate": escalate,
    }


@router.get("/interactions")
def list_interactions(request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    # Was unauthenticated until now — returned the last 50 full visitor
    # chat transcripts (AiInteraction.messages) to anyone who called it,
    # with no frontend caller at all. Same class of leak as the
    # /api/public/audit/reports fix: staff-only data, zero gate.
    return db.query(models.AiInteraction).order_by(models.AiInteraction.created_at.desc()).limit(50).all()
