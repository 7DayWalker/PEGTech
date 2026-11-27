"""
Chat routes — AI CSR and conversation logging.
"""
import json
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app import escalation_summary
from app.services import csr_response as ai_csr

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/csr")
def csr_chat(payload: dict, background_tasks: BackgroundTasks, request: Request, db: Session = Depends(get_db)):
    """AI CSR — first response before human joins."""
    message = payload.get("message", "")
    session_id = payload.get("session_id", "default")
    history = payload.get("history", [])

    result = ai_csr(message, history)
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
def list_interactions(request: Request, db: Session = Depends(get_db)):
    return db.query(models.AiInteraction).order_by(models.AiInteraction.created_at.desc()).limit(50).all()
