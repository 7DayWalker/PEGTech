"""
Closes the loop the public CSR widget's copy has been promising without
actually wiring up: "a human usually joins within 2 minutes."

Before this module, triggering `escalate=true` only wrote an Escalation
row to the database — no one was told it existed until a staff member
happened to open the Dashboard. There was also no reliable way to reach
an anonymous website visitor back even if staff did see it immediately,
since nothing ever asked them for contact info.

This module does the two things actually needed to make that promise
real, within the existing infrastructure (no new services):

1. `extract_contact_info()` — pulls an email/phone the visitor volunteered
   out of the conversation transcript, so staff have something to follow
   up with.
2. `notify_staff_of_escalation()` — emails every active staff account
   immediately (via the existing Resend integration) with the reason,
   transcript, and whatever contact info was found, so a human actually
   learns about it within moments rather than whenever they next check
   the Dashboard.

Note what this deliberately does NOT do: it does not give staff a way to
reply *into* the visitor's open chat window — that would need a
real-time channel (websocket/polling) this app doesn't have. The realistic
mechanism is a human following up directly by phone/email/WhatsApp using
the captured contact info, not a live takeover of the same chat session.
"""
from __future__ import annotations

import logging
import re
from typing import Optional

from sqlalchemy.orm import Session

from app import models
from app.integrations.email_client import send_email

logger = logging.getLogger("pegtech.escalation_notify")

_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
# Loosely matches phone-ish runs of digits (7-15 of them, optional +,
# spaces/dashes/parens allowed between) — deliberately permissive since
# this is "does the visitor appear to have given a number worth trying,"
# not a strict international-format validator.
_PHONE_RE = re.compile(r"(?<!\d)(\+?\d[\d\s\-().]{6,16}\d)(?!\d)")


def extract_contact_info(text: str) -> tuple[Optional[str], Optional[str]]:
    """Returns (email, phone) found anywhere in `text`, or (None, None)
    for whichever wasn't present. Takes the first match of each — a
    visitor correcting themselves mid-conversation is a rare enough edge
    case that "first mentioned" is a reasonable, simple default."""
    email_match = _EMAIL_RE.search(text)
    email = email_match.group(0) if email_match else None

    phone = None
    for candidate in _PHONE_RE.findall(text):
        digits = re.sub(r"\D", "", candidate)
        if 7 <= len(digits) <= 15:
            phone = candidate.strip()
            break

    return email, phone


def _escalation_email_html(esc: models.Escalation) -> str:
    contact_line = ""
    if esc.contact_email or esc.contact_phone:
        parts = [p for p in (esc.contact_email, esc.contact_phone) if p]
        contact_line = f"<p><strong>Visitor contact:</strong> {' · '.join(parts)}</p>"
    else:
        contact_line = (
            "<p><strong>Visitor contact:</strong> not shared — no direct way to "
            "follow up outside the chat widget itself.</p>"
        )

    transcript_html = (
        (esc.transcript or "").replace("&", "&amp;").replace("<", "&lt;").replace("\n", "<br>")
    )

    return (
        f"<p>A conversation on the PEGTech site was just flagged for a human.</p>"
        f"<p><strong>Reason:</strong> {esc.reason}</p>"
        f"<p><strong>Sentiment:</strong> {esc.sentiment} &nbsp;|&nbsp; "
        f"<strong>Source:</strong> {esc.source}</p>"
        f"{contact_line}"
        f"<p><strong>AI summary:</strong> {esc.ai_summary or esc.summary}</p>"
        f"<hr>"
        f"<p style='font-size:13px;color:#555'>{transcript_html}</p>"
        f"<hr>"
        f"<p style='font-size:12px;color:#888'>Open the Dashboard's Escalations "
        f"list to resolve this once handled.</p>"
    )


def notify_staff_of_escalation(escalation_id: int) -> None:
    """Background task (called via FastAPI BackgroundTasks) — opens its
    own DB session since the request's session is gone by the time this
    runs. Best-effort: logs and returns on any failure rather than ever
    raising into the background-task runner."""
    from app.db import SessionLocal

    db: Session = SessionLocal()
    try:
        esc = db.get(models.Escalation, escalation_id)
        if esc is None:
            logger.warning("notify_staff_of_escalation: escalation %s not found", escalation_id)
            return

        staff = (
            db.query(models.AdminUser)
            .filter(models.AdminUser.is_active.is_(True))
            .all()
        )
        if not staff:
            logger.warning("notify_staff_of_escalation: no active staff accounts to notify")
            return

        subject = f"🚨 Chat escalation needs a human — {esc.reason}"
        html = _escalation_email_html(esc)
        for user in staff:
            if not user.email:
                continue
            result = send_email(user.email, subject, html)
            if result["status"] == "sent":
                logger.info("notify_staff_of_escalation: alerted %s for escalation %s", user.email, esc.id)
            else:
                logger.warning(
                    "notify_staff_of_escalation: failed to alert %s for escalation %s: %s",
                    user.email, esc.id, result.get("error"),
                )
    finally:
        db.close()
