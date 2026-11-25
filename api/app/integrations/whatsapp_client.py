"""
WhatsApp Business Cloud API integration (Meta Graph API).

Degrades gracefully: if WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID are
not set, send_whatsapp_text() returns a "skipped" result instead of raising.

Note on Meta's messaging rules: a plain text message ("send_whatsapp_text")
can only be delivered inside the 24-hour customer-service window — i.e.
after the recipient has messaged this WhatsApp number first. Outside that
window Meta requires a pre-approved message "template" instead. This client
exposes both; wire up template sends once you've created & had templates
approved in Meta Business Manager.
"""
import httpx
from app import config

GRAPH_API_VERSION = "v21.0"


def _graph_url() -> str:
    return f"https://graph.facebook.com/{GRAPH_API_VERSION}/{config.WHATSAPP_PHONE_NUMBER_ID}/messages"


def _not_configured() -> dict:
    return {
        "status": "skipped_not_configured",
        "error": "WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID are not set — WhatsApp sending is disabled.",
    }


def send_whatsapp_text(to: str, text: str) -> dict:
    """Send a free-form text message. Only deliverable within the 24h
    customer-service window (i.e. the recipient messaged this number first
    within the last 24 hours) — otherwise Meta will reject it and you need
    send_whatsapp_template() instead."""
    if not config.WHATSAPP_ACCESS_TOKEN or not config.WHATSAPP_PHONE_NUMBER_ID:
        return _not_configured()

    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": text},
    }
    return _post(payload)


def send_whatsapp_template(to: str, template_name: str, language: str = "en_US", params: list[str] | None = None) -> dict:
    """Send a pre-approved template message — required for any outbound
    message outside the 24h customer-service window (cold outreach,
    reminders, stage-change notifications to leads who haven't messaged
    first). The template must already exist & be approved in Meta Business
    Manager before this will work."""
    if not config.WHATSAPP_ACCESS_TOKEN or not config.WHATSAPP_PHONE_NUMBER_ID:
        return _not_configured()

    components = []
    if params:
        components.append({
            "type": "body",
            "parameters": [{"type": "text", "text": p} for p in params],
        })

    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": language},
            "components": components,
        },
    }
    return _post(payload)


def _post(payload: dict) -> dict:
    try:
        resp = httpx.post(
            _graph_url(),
            headers={
                "Authorization": f"Bearer {config.WHATSAPP_ACCESS_TOKEN}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=15,
        )
    except httpx.HTTPError as e:
        return {"status": "failed", "error": f"Network error calling WhatsApp Cloud API: {e}"}

    if resp.status_code == 200:
        data = resp.json()
        msg_id = (data.get("messages") or [{}])[0].get("id")
        return {"status": "sent", "provider_id": msg_id}

    return {
        "status": "failed",
        "error": f"WhatsApp API error {resp.status_code}: {resp.text[:400]}",
    }
