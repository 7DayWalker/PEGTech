"""
Messaging routes — staff manually email/WhatsApp a lead or client, and view
the message history logged for each.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app import schemas
from app.deps import require_staff
from app import notifications
from app.integrations import whatsapp_client as wa_client

router = APIRouter(prefix="/api/admin", tags=["messaging"])

# Keep Postgres-stored media bounded — WhatsApp's own caps are higher
# (images 5MB, video/audio 16MB, documents 100MB) but this app stores
# every attachment as a BYTEA row rather than external object storage, by
# explicit choice, so a lower shared ceiling keeps the database healthy.
MAX_MEDIA_BYTES = 16 * 1024 * 1024  # 16MB


def _whatsapp_media_type(mime_type: str) -> str:
    if mime_type.startswith("image/"):
        return "image"
    if mime_type.startswith("video/"):
        return "video"
    if mime_type.startswith("audio/"):
        return "audio"
    return "document"


async def _send_whatsapp_media_common(
    db: Session, to_address: str, file: UploadFile, caption: str,
    lead_id: int | None, client_id: int | None, sent_by_id: int,
) -> models.MessageLog:
    data = await file.read()
    if len(data) > MAX_MEDIA_BYTES:
        raise HTTPException(status_code=413, detail=f"File too large — max {MAX_MEDIA_BYTES // (1024*1024)}MB.")
    if not data:
        raise HTTPException(status_code=400, detail="Empty file.")

    mime_type = file.content_type or "application/octet-stream"
    media_type = _whatsapp_media_type(mime_type)
    filename = file.filename or "attachment"

    upload = wa_client.upload_whatsapp_media(data, mime_type, filename)
    if upload.get("status") != "uploaded":
        status = "skipped_not_configured" if upload.get("status") == "skipped_not_configured" else "failed"
        message_log = models.MessageLog(
            channel="whatsapp", lead_id=lead_id, client_id=client_id, to_address=to_address,
            body=caption or f"[{media_type}: {filename}]", trigger="manual", status=status,
            direction="outbound", error=upload.get("error"), sent_by_id=sent_by_id,
        )
        db.add(message_log)
        db.commit()
        db.refresh(message_log)
        return message_log

    send_result = wa_client.send_whatsapp_media(
        to_address, upload["media_id"], media_type, caption=caption or None, filename=filename,
    )

    asset = models.MediaAsset(mime_type=mime_type, filename=filename, size_bytes=len(data), data=data)
    db.add(asset)
    db.flush()  # assign asset.id without a full commit yet

    message_log = models.MessageLog(
        channel="whatsapp", lead_id=lead_id, client_id=client_id, to_address=to_address,
        body=caption or f"[{media_type}: {filename}]", trigger="manual",
        status=send_result.get("status", "failed"), direction="outbound",
        media_id=asset.id, media_type=media_type,
        provider_id=send_result.get("provider_id"), error=send_result.get("error"),
        sent_by_id=sent_by_id,
    )
    db.add(message_log)
    db.commit()
    db.refresh(message_log)
    return message_log


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


@router.post("/leads/{lead_id}/whatsapp-media", response_model=schemas.MessageLogOut)
async def whatsapp_lead_media(lead_id: int, file: UploadFile = File(...), caption: str = Form(""),
                               db: Session = Depends(get_db), staff=Depends(require_staff())):
    lead = db.get(models.Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")
    if not lead.phone:
        raise HTTPException(status_code=400, detail="This lead has no phone number on file.")
    message_log = await _send_whatsapp_media_common(
        db, lead.phone, file, caption, lead_id=lead_id, client_id=None, sent_by_id=staff.id,
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


@router.post("/clients/{client_id}/whatsapp-media", response_model=schemas.MessageLogOut)
async def whatsapp_client_media(client_id: int, file: UploadFile = File(...), caption: str = Form(""),
                                 db: Session = Depends(get_db), staff=Depends(require_staff())):
    client = db.get(models.Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")
    if not client.phone:
        raise HTTPException(status_code=400, detail="This client has no phone number on file.")
    return await _send_whatsapp_media_common(
        db, client.phone, file, caption, lead_id=None, client_id=client_id, sent_by_id=staff.id,
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
