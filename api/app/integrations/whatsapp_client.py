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


def upload_whatsapp_media(file_bytes: bytes, mime_type: str, filename: str) -> dict:
    """Upload a file to Meta's servers so it can be referenced by ID in a
    message. Returns {"status": "uploaded", "media_id": ...} on success."""
    if not config.WHATSAPP_ACCESS_TOKEN or not config.WHATSAPP_PHONE_NUMBER_ID:
        return _not_configured()

    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{config.WHATSAPP_PHONE_NUMBER_ID}/media"
    try:
        resp = httpx.post(
            url,
            headers={"Authorization": f"Bearer {config.WHATSAPP_ACCESS_TOKEN}"},
            data={"messaging_product": "whatsapp"},
            files={"file": (filename, file_bytes, mime_type)},
            timeout=30,
        )
    except httpx.HTTPError as e:
        return {"status": "failed", "error": f"Network error uploading media to WhatsApp: {e}"}

    if resp.status_code == 200:
        return {"status": "uploaded", "media_id": resp.json().get("id")}
    return {"status": "failed", "error": f"WhatsApp media upload error {resp.status_code}: {resp.text[:400]}"}


def send_whatsapp_media(to: str, media_id: str, media_type: str, caption: str | None = None, filename: str | None = None) -> dict:
    """Send a message referencing already-uploaded media. media_type is one
    of image/video/audio/document/sticker (audio and sticker don't support
    captions or filenames per Meta's API)."""
    if not config.WHATSAPP_ACCESS_TOKEN or not config.WHATSAPP_PHONE_NUMBER_ID:
        return _not_configured()

    media_obj: dict = {"id": media_id}
    if caption and media_type in ("image", "video", "document"):
        media_obj["caption"] = caption
    if filename and media_type == "document":
        media_obj["filename"] = filename

    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": media_type,
        media_type: media_obj,
    }
    return _post(payload)


def get_whatsapp_media_url(media_id: str) -> dict:
    """Resolve a WhatsApp media ID to a temporary, auth-required download
    URL + its reported mime type / size."""
    if not config.WHATSAPP_ACCESS_TOKEN:
        return _not_configured()

    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{media_id}"
    try:
        resp = httpx.get(url, headers={"Authorization": f"Bearer {config.WHATSAPP_ACCESS_TOKEN}"}, timeout=15)
    except httpx.HTTPError as e:
        return {"status": "failed", "error": f"Network error resolving WhatsApp media: {e}"}

    if resp.status_code == 200:
        data = resp.json()
        return {"status": "ok", "url": data.get("url"), "mime_type": data.get("mime_type"), "file_size": data.get("file_size")}
    return {"status": "failed", "error": f"WhatsApp media lookup error {resp.status_code}: {resp.text[:400]}"}


def download_whatsapp_media(media_url: str) -> dict:
    """Download the actual bytes from a URL resolved by get_whatsapp_media_url().
    Meta's media CDN requires the same bearer token used for the Graph API."""
    if not config.WHATSAPP_ACCESS_TOKEN:
        return _not_configured()
    try:
        resp = httpx.get(media_url, headers={"Authorization": f"Bearer {config.WHATSAPP_ACCESS_TOKEN}"}, timeout=30)
    except httpx.HTTPError as e:
        return {"status": "failed", "error": f"Network error downloading WhatsApp media: {e}"}
    if resp.status_code == 200:
        return {"status": "ok", "data": resp.content}
    return {"status": "failed", "error": f"WhatsApp media download error {resp.status_code}"}


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
