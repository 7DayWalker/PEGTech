"""
Chat routes — AI CSR and conversation logging.
"""
import json
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app.services import csr_response as ai_csr

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/csr")
def csr_chat(payload: dict, request: Request, db: Session = Depends(get_db)):
    """AI CSR — first response before human joins."""
    message = payload.get("message", "")
    session_id = payload.get("session_id", "default")
    history = payload.get("history", [])

    result = ai_csr(message, history)

    # Log the interaction
    interaction = models.AiInteraction(
        session_id=session_id,
        user_type="visitor",
        channel="web",
        messages=json.dumps([*history, {"role": "user", "content": message}, {"role": "assistant", "content": result["response"]}]),
        ai_summary=result.get("response"),
        escalated=result.get("escalate", False),
    )
    db.add(interaction)
    db.commit()

    return {
        "response": result["response"],
        "intent": result.get("intent", "general_inquiry"),
        "escalate": result.get("escalate", False),
    }


@router.get("/interactions")
def list_interactions(request: Request, db: Session = Depends(get_db)):
    return db.query(models.AiInteraction).order_by(models.AiInteraction.created_at.desc()).limit(50).all()
