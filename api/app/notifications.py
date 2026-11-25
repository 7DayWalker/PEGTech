"""
Notification orchestration: logs every send attempt to MessageLog, and
triggers automatic lead-stage-change notifications (email + WhatsApp) when
a lead is opted in to the relevant channel.
"""
from sqlalchemy.orm import Session
from app import models
from app.integrations.email_client import send_email
from app.integrations.whatsapp_client import send_whatsapp_text

STAGE_NAMES = ["New", "Contacted", "Qualified", "Proposal", "Won"]

# Simple templates for automatic stage-change notifications. These are sent
# as plain WhatsApp text (only deliverable within the 24h window — i.e. the
# lead messaged in first) and plain email. For cold WhatsApp outreach
# outside that window, use send_whatsapp_template() with an approved
# template instead — see app/integrations/whatsapp_client.py.
STAGE_EMAIL_TEMPLATES = {
    1: ("You're on our radar, {name}!",
        "<p>Hi {name},</p><p>Thanks for your interest in <strong>{service}</strong>! "
        "We've logged your enquiry and someone from PEGTech will be in touch shortly.</p>"),
    2: ("Great news — you're qualified!",
        "<p>Hi {name},</p><p>We've reviewed your details for <strong>{service}</strong> "
        "and you're a great fit. Expect a proposal from us soon.</p>"),
    3: ("Your proposal is on its way",
        "<p>Hi {name},</p><p>We've put together a proposal for <strong>{service}</strong>. "
        "Keep an eye on your inbox!</p>"),
    4: ("Welcome aboard, {name}!",
        "<p>Hi {name},</p><p>Welcome to PEGTech! We're excited to get started on "
        "<strong>{service}</strong>.</p>"),
}

STAGE_WHATSAPP_TEMPLATES = {
    1: "Hi {name}, thanks for reaching out about {service}! We've got your enquiry and will be in touch shortly. — PEGTech",
    2: "Hi {name}, good news — you're qualified for {service}. A proposal is coming your way soon! — PEGTech",
    3: "Hi {name}, your proposal for {service} is ready. Check your email! — PEGTech",
    4: "Welcome aboard, {name}! We're excited to kick off {service} with you. — PEGTech",
}


def _log(db: Session, **kwargs) -> models.MessageLog:
    entry = models.MessageLog(**kwargs)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def send_lead_email(db: Session, lead: models.Lead, subject: str, body_html: str,
                     trigger: str = "manual", sent_by_id: int | None = None) -> models.MessageLog:
    if not lead.email:
        result = {"status": "failed", "error": "Lead has no email address on file."}
    else:
        result = send_email(lead.email, subject, body_html)
    return _log(
        db, channel="email", lead_id=lead.id, to_address=lead.email or "",
        subject=subject, body=body_html, trigger=trigger,
        status=result["status"], provider_id=result.get("provider_id"),
        error=result.get("error"), sent_by_id=sent_by_id,
    )


def send_lead_whatsapp(db: Session, lead: models.Lead, message: str,
                        trigger: str = "manual", sent_by_id: int | None = None) -> models.MessageLog:
    if not lead.phone:
        result = {"status": "failed", "error": "Lead has no phone number on file."}
    else:
        result = send_whatsapp_text(lead.phone, message)
    return _log(
        db, channel="whatsapp", lead_id=lead.id, to_address=lead.phone or "",
        body=message, trigger=trigger,
        status=result["status"], provider_id=result.get("provider_id"),
        error=result.get("error"), sent_by_id=sent_by_id,
    )


def send_client_email(db: Session, client: models.Client, subject: str, body_html: str,
                       trigger: str = "manual", sent_by_id: int | None = None) -> models.MessageLog:
    if not client.email:
        result = {"status": "failed", "error": "Client has no email address on file."}
    else:
        result = send_email(client.email, subject, body_html)
    return _log(
        db, channel="email", client_id=client.id, to_address=client.email or "",
        subject=subject, body=body_html, trigger=trigger,
        status=result["status"], provider_id=result.get("provider_id"),
        error=result.get("error"), sent_by_id=sent_by_id,
    )


def send_client_whatsapp(db: Session, client: models.Client, message: str,
                          trigger: str = "manual", sent_by_id: int | None = None) -> models.MessageLog:
    if not client.phone:
        result = {"status": "failed", "error": "Client has no phone number on file."}
    else:
        result = send_whatsapp_text(client.phone, message)
    return _log(
        db, channel="whatsapp", client_id=client.id, to_address=client.phone or "",
        body=message, trigger=trigger,
        status=result["status"], provider_id=result.get("provider_id"),
        error=result.get("error"), sent_by_id=sent_by_id,
    )


def notify_lead_stage_change(db: Session, lead: models.Lead, old_stage: int, new_stage: int) -> None:
    """Fire-and-log automatic email/WhatsApp notifications when a lead
    advances to a new pipeline stage, respecting their opt-in flags.
    Never raises — failures are recorded on MessageLog, not surfaced to the
    caller, so a notification problem never blocks the stage update itself."""
    if new_stage == old_stage or new_stage not in STAGE_EMAIL_TEMPLATES:
        return
    if lead.opt_out:
        return

    service = lead.service or "your project"
    name = lead.name or "there"

    if lead.email_opt_in and lead.email:
        subject_tpl, body_tpl = STAGE_EMAIL_TEMPLATES[new_stage]
        subject = subject_tpl.format(name=name, service=service)
        body = body_tpl.format(name=name, service=service)
        send_lead_email(db, lead, subject, body, trigger="stage_change")

    if lead.whatsapp_opt_in and lead.phone:
        text = STAGE_WHATSAPP_TEMPLATES[new_stage].format(name=name, service=service)
        send_lead_whatsapp(db, lead, text, trigger="stage_change")
