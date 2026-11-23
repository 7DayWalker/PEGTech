"""
Email service via SMTP.
Works with Gmail, SendGrid, Mailgun, or any SMTP provider.
"""
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any
import os

from app.config import settings


class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", settings.smtp_host)
        self.smtp_port = int(os.getenv("SMTP_PORT", str(settings.smtp_port)))
        self.smtp_user = os.getenv("SMTP_USER", settings.smtp_user)
        self.smtp_password = os.getenv("SMTP_PASSWORD", settings.smtp_password)

    async def send(
        self,
        to: str,
        subject: str,
        body_text: str,
        body_html: str | None = None,
        unsubscribe_token: str = "",
        preview_url: str = "",
    ) -> Dict[str, Any]:
        """Send an email via SMTP. Returns {success, message_id, error}."""
        if not self.smtp_user or not self.smtp_password:
            return {
                "success": False,
                "message_id": None,
                "error": "SMTP credentials not configured (SMTP_USER / SMTP_PASSWORD)",
            }

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.sender_name} <{settings.sender_email}>" if settings.sender_name else settings.sender_email
            msg["To"] = to

            msg.attach(MIMEText(body_text, "plain"))
            if body_html:
                msg.attach(MIMEText(body_html, "html"))

            # List-Unsubscribe for CAN-SPAM / Gmail / Yahoo compliance
            if settings.unsubscribe_base_url and unsubscribe_token:
                msg["List-Unsubscribe"] = f"<{settings.unsubscribe_base_url}/unsubscribe?token={unsubscribe_token}>"
                msg["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"

            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=30) as server:
                server.starttls(context=context)
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            return {"success": True, "message_id": None, "error": None}
        except Exception as e:
            return {"success": False, "message_id": None, "error": str(e)}


email_service = EmailService()