"""
Resend email integration.

Degrades gracefully: if RESEND_API_KEY is not set (local dev, or Railway
before the env var is configured), send_email() returns a "skipped" result
instead of raising — callers log that to MessageLog and the caller/caller's
UI can surface it, but nothing crashes.
"""
import httpx
from app import config


def send_email(to: str, subject: str, html: str) -> dict:
    """Send a transactional email via Resend. Returns a dict with at least
    a `status` key: "sent", "failed", or "skipped_not_configured"."""
    if not config.RESEND_API_KEY:
        return {
            "status": "skipped_not_configured",
            "error": "RESEND_API_KEY is not set — email sending is disabled.",
        }

    try:
        resp = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {config.RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": config.PEGTECH_EMAIL_FROM,
                "to": [to],
                "subject": subject,
                "html": html,
            },
            timeout=15,
        )
    except httpx.HTTPError as e:
        return {"status": "failed", "error": f"Network error calling Resend: {e}"}

    if resp.status_code in (200, 201):
        data = resp.json()
        return {"status": "sent", "provider_id": data.get("id")}

    return {
        "status": "failed",
        "error": f"Resend API error {resp.status_code}: {resp.text[:400]}",
    }
