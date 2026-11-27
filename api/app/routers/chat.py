"""
Chat routes — AI CSR and conversation logging.
"""
import json
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app import escalation_summary
from app import escalation_notify
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
    #
    # One open escalation per session, not one per flagged turn: a
    # visitor can stay "frustrated" across several back-and-forth
    # messages, and each of those used to spawn its own duplicate row /
    # staff email. This reuses the session's existing queued escalation
    # (if any) instead, and always tries to capture contact info from the
    # visitor's latest message even on a turn that isn't itself
    # escalate=true — e.g. calmly answering "what's a good number?" right
    # after being asked, which is exactly when it's most likely to show
    # up and most important not to miss.
    existing_esc = (
        db.query(models.Escalation)
        .filter(models.Escalation.session_id == session_id, models.Escalation.status == "queued")
        .order_by(models.Escalation.created_at.desc())
        .first()
    )
    msg_email, msg_phone = escalation_notify.extract_contact_info(message)

    esc = existing_esc
    newly_created = False

    if escalate:
        transcript_lines = [f"{m.get('role', 'user')}: {m.get('content', '')}" for m in history]
        transcript_lines.append(f"user: {message}")
        full_transcript = "\n".join(transcript_lines)[-4000:]

        if esc is None:
            # Without this, staff had nothing to follow up with for an
            # anonymous CSR-widget visitor even if they saw the
            # escalation instantly — pull out any contact info anywhere
            # in the conversation so far, not just this one message.
            full_email, full_phone = escalation_notify.extract_contact_info(full_transcript)
            esc = models.Escalation(
                source="csr_widget",
                client_id=None,
                lead_id=None,
                session_id=session_id,
                contact_email=full_email,
                contact_phone=full_phone,
                summary=message[:300],
                transcript=full_transcript,
                reason=f"Visitor flagged during a {result.get('intent', 'general_inquiry')} conversation",
                sentiment="negative",
                status="queued",
            )
            db.add(esc)
            db.flush()  # assign esc.id before the background tasks need to look it up
            newly_created = True
        else:
            esc.transcript = full_transcript

    contact_added = False
    if esc is not None:
        if msg_email and not esc.contact_email:
            esc.contact_email = msg_email
            contact_added = True
        if msg_phone and not esc.contact_phone:
            esc.contact_phone = msg_phone
            contact_added = True

    db.commit()

    if newly_created:
        background_tasks.add_task(escalation_summary.summarize_and_save_background, esc.id)
        # Previously an escalation only ever wrote a row no one was told
        # about — the widget's "a human usually joins within 2 minutes"
        # copy had nothing behind it until a staff member happened to
        # open the Dashboard. This alerts every active staff account
        # immediately.
        background_tasks.add_task(escalation_notify.notify_staff_of_escalation, esc.id)
    elif esc is not None and contact_added:
        # The one case worth a second alert: staff already got told about
        # this conversation with no way to reach the visitor, and contact
        # info just arrived on a later turn — that's the moment a human
        # can actually act on it.
        background_tasks.add_task(escalation_notify.notify_staff_of_escalation, esc.id)

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
