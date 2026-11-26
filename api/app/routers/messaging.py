"""
Messaging routes — staff manually email/WhatsApp a lead or client, and view
the message history logged for each.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app import schemas
from app.deps import require_staff
from app import notifications

router = APIRouter(prefix="/api/admin", tags=["messaging"])


def _maybe_advance_new_to_contacted(db: Session, lead: models.Lead, message_log: models.MessageLog) -> None:
    """A manually-sent message counts as having contacted the lead: bump a
    brand-new lead (stage 0) to 'Contacted' (stage 1). Never skips stages,
    never moves a lead backward, and only fires on a message that actually
    went out — a failed/unconfigured send doesn't count as contact."""
    if lead.stage != 0 or message_log.status != "sent":
        return
    lead.stage = 1
    db.commit()
    db.refresh(lead)


# ── Leads ──
@router.post("/leads/{lead_id}/email", response_model=schemas.MessageLogOut)
def email_lead(lead_id: int, payload: schemas.EmailSendIn, request: Request,
                db: Session = Depends(get_db), staff=Depends(require_staff())):
    lead = db.get(models.Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")
    message_log = notifications.send_lead_email(
        db, lead, payload.subject, payload.body, trigger="manual", sent_by_id=staff.id,
    )
    _maybe_advance_new_to_contacted(db, lead, message_log)
    return message_log


@router.post("/leads/{lead_id}/whatsapp", response_model=schemas.MessageLogOut)
def whatsapp_lead(lead_id: int, payload: schemas.WhatsAppSendIn, request: Request,
                   db: Session = Depends(get_db), staff=Depends(require_staff())):
    lead = db.get(models.Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")
    message_log = notifications.send_lead_whatsapp(
        db, lead, payload.message, trigger="manual", sent_by_id=staff.id,
    )
    _maybe_advance_new_to_contacted(db, lead, message_log)
    return message_log


@router.get("/leads/{lead_id}/messages", response_model=list[schemas.MessageLogOut])
def list_lead_messages(lead_id: int, request: Request,
                        db: Session = Depends(get_db), _=Depends(require_staff())):
    return (
        db.query(models.MessageLog)
        .filter_by(lead_id=lead_id)
        .order_by(models.MessageLog.created_at.desc())
        .all()
    )


# ── Clients ──
@router.post("/clients/{client_id}/email", response_model=schemas.MessageLogOut)
def email_client(client_id: int, payload: schemas.EmailSendIn, request: Request,
                  db: Session = Depends(get_db), staff=Depends(require_staff())):
    client = db.get(models.Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")
    return notifications.send_client_email(
        db, client, payload.subject, payload.body, trigger="manual", sent_by_id=staff.id,
    )


@router.post("/clients/{client_id}/whatsapp", response_model=schemas.MessageLogOut)
def whatsapp_client(client_id: int, payload: schemas.WhatsAppSendIn, request: Request,
                     db: Session = Depends(get_db), staff=Depends(require_staff())):
    client = db.get(models.Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")
    return notifications.send_client_whatsapp(
        db, client, payload.message, trigger="manual", sent_by_id=staff.id,
    )


@router.get("/clients/{client_id}/messages", response_model=list[schemas.MessageLogOut])
def list_client_messages(client_id: int, request: Request,
                          db: Session = Depends(get_db), _=Depends(require_staff())):
    return (
        db.query(models.MessageLog)
        .filter_by(client_id=client_id)
        .order_by(models.MessageLog.created_at.desc())
        .all()
    )
