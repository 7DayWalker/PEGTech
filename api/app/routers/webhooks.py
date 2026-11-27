"""
Inbound WhatsApp webhook (Meta Cloud API).

  GET  /api/webhooks/whatsapp  — Meta's one-time verification handshake.
  POST /api/webhooks/whatsapp  — incoming message + delivery-status events.

One-time setup in Meta's dashboard (App Dashboard -> WhatsApp ->
Configuration -> Webhook):
    Callback URL:   https://<your-domain>/api/webhooks/whatsapp
    Verify token:   same value as the WHATSAPP_VERIFY_TOKEN env var
  Then subscribe the "messages" field.

Behavior:
  - An inbound message is matched to an existing Lead by phone number
    (last-10-digits comparison, so +234/234/0-prefixed formats all match).
    If no lead matches, a brand-new 'New' stage lead is created from the
    WhatsApp contact so nothing gets lost.
  - Every inbound message is logged to MessageLog (direction='inbound',
    status='received') and shows up in that lead's Message Center history.
  - A first inbound message also counts as being 'Contacted' — same rule
    already applied to a manually-sent message — advancing a brand-new
    lead from stage 0 to 1.
  - Delivery/read receipts for messages PEGTech sent are reflected back
    onto the matching outbound MessageLog row (matched by provider_id).
  - Webhook deliveries are de-duplicated by WhatsApp's own message id, so
    Meta's at-least-once retry behavior can never double-log a message.
  - Always returns 200 quickly once the signature check passes — Meta
    retries aggressively (and can disable the webhook) on non-200s, so
    processing errors are swallowed and logged server-side instead of
    surfaced to the caller.
"""
import hashlib
import hmac

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy.orm import Session

from app import config, models
from app.db import get_db
from app.integrations import whatsapp_client as wa_client
from app.phone_utils import phones_match as _phones_match

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

# Same ceiling as outbound sends (routers/messaging.py) — media is stored
# directly in Postgres as a BYTEA row, so this keeps the database bounded
# under heavy inbound media traffic.
MAX_INBOUND_MEDIA_BYTES = 16 * 1024 * 1024  # 16MB

_MEDIA_FALLBACK_LABELS = {
    "image": "\U0001F4F7 Photo",
    "video": "\U0001F3A5 Video",
    "audio": "\U0001F3A4 Voice note / audio",
    "document": "\U0001F4C4 Document",
    "sticker": "Sticker",
}

# WhatsApp delivers a handful of events it can't pass the actual content
# for — most commonly a deleted/revoked message or an edited one — as a
# message with type "unsupported" and an `unsupported.type` subfield
# naming what actually happened. See Meta error 131051.
_UNSUPPORTED_SUBTYPE_LABELS = {
    "delete": "\U0001F5D1\uFE0F This message was deleted",
    "edit": "\u270F\uFE0F Edited a message (edit not supported here — original text shown above)",
    "pin": "\U0001F4CC Pinned a message",
    "unpin": "Unpinned a message",
    "poll_creation": "\U0001F4CA Sent a poll (polls aren't supported here — ask them to reply with text)",
    "poll_update": "\U0001F4CA Updated a poll",
}


@router.get("/whatsapp")
async def verify_whatsapp_webhook(request: Request):
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge") or ""

    if (
        mode == "subscribe"
        and config.WHATSAPP_VERIFY_TOKEN
        and token
        and hmac.compare_digest(token, config.WHATSAPP_VERIFY_TOKEN)
    ):
        return PlainTextResponse(challenge)
    return PlainTextResponse("Verification failed.", status_code=403)


@router.post("/whatsapp")
async def receive_whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    raw_body = await request.body()

    if config.WHATSAPP_APP_SECRET:
        signature = request.headers.get("x-hub-signature-256", "")
        expected = "sha256=" + hmac.new(
            config.WHATSAPP_APP_SECRET.encode(), raw_body, hashlib.sha256
        ).hexdigest()
        if not signature or not hmac.compare_digest(signature, expected):
            return JSONResponse({"detail": "Invalid signature."}, status_code=403)
    else:
        print("whatsapp webhook: WHATSAPP_APP_SECRET not set — skipping signature check.", flush=True)

    try:
        payload = await request.json()
        _process_payload(db, payload)
    except Exception as e:
        print(f"whatsapp webhook: error processing payload: {e}", flush=True)

    return {"status": "ok"}


def _process_payload(db: Session, payload: dict) -> None:
    if payload.get("object") != "whatsapp_business_account":
        return
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            if change.get("field") != "messages":
                continue
            value = change.get("value", {})
            _handle_inbound_messages(db, value)
            _handle_status_updates(db, value)


def _find_or_create_lead(db: Session, wa_id: str, profile_name: str | None) -> models.Lead:
    for lead in db.query(models.Lead).filter(models.Lead.phone.isnot(None)).all():
        if _phones_match(lead.phone, wa_id):
            return lead

    lead = models.Lead(
        name=profile_name or f"WhatsApp +{wa_id}",
        business_name="",  # defense-in-depth: avoid NOT NULL surprises regardless of live schema state
        phone=f"+{wa_id}",
        source="WhatsApp (inbound)",
        stage=0,
        score="WARM",
        whatsapp_opt_in=True,  # they messaged us first — implied consent
        country="NG",
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


def _store_inbound_media(db: Session, wa_media_id: str, media_type: str) -> tuple[int | None, str]:
    """Download inbound media from Meta's CDN and store it as a MediaAsset
    row. Returns (asset_id_or_None, fallback_caption) — any failure along
    the way (lookup, download, oversize) degrades to a text-only fallback
    label rather than losing the message entirely."""
    fallback = _MEDIA_FALLBACK_LABELS.get(media_type, f"[{media_type}]")

    lookup = wa_client.get_whatsapp_media_url(wa_media_id)
    if lookup.get("status") != "ok":
        print(f"whatsapp webhook: media lookup failed: {lookup.get('error')}", flush=True)
        return None, fallback

    download = wa_client.download_whatsapp_media(lookup["url"])
    if download.get("status") != "ok":
        print(f"whatsapp webhook: media download failed: {download.get('error')}", flush=True)
        return None, fallback

    data = download["data"]
    if len(data) > MAX_INBOUND_MEDIA_BYTES:
        print(f"whatsapp webhook: inbound media too large ({len(data)} bytes) — storing text fallback only", flush=True)
        return None, fallback

    asset = models.MediaAsset(
        mime_type=lookup.get("mime_type") or "application/octet-stream",
        size_bytes=len(data),
        data=data,
    )
    db.add(asset)
    db.flush()  # assign asset.id without a full commit yet
    return asset.id, fallback


def _extract_text(msg: dict) -> str:
    msg_type = msg.get("type")
    if msg_type == "text":
        return msg.get("text", {}).get("body", "")
    if msg_type in ("image", "video", "audio", "document", "sticker"):
        caption = (msg.get(msg_type) or {}).get("caption")
        return caption or f"[{msg_type} received — view in WhatsApp Business app]"
    if msg_type == "location":
        loc = msg.get("location", {})
        return f"[Location shared: {loc.get('latitude')}, {loc.get('longitude')}]"
    if msg_type == "button":
        return msg.get("button", {}).get("text") or "[button reply]"
    if msg_type == "interactive":
        interactive = msg.get("interactive", {})
        if interactive.get("type") == "button_reply":
            return interactive.get("button_reply", {}).get("title", "[button reply]")
        if interactive.get("type") == "list_reply":
            return interactive.get("list_reply", {}).get("title", "[list reply]")
    if msg_type == "reaction":
        # A tap-react (👍, ❤️, etc.) on one of our messages, not a new
        # message of its own — WhatsApp still delivers it as a webhook
        # event with its own message id, so it's logged like any reply.
        emoji = (msg.get("reaction") or {}).get("emoji")
        return f"{emoji} (reacted to a message)" if emoji else "Reacted to a message"
    if msg_type == "contacts":
        names = [
            (c.get("name") or {}).get("formatted_name")
            for c in (msg.get("contacts") or [])
            if (c.get("name") or {}).get("formatted_name")
        ]
        return f"[Shared contact: {', '.join(names)}]" if names else "[Shared a contact card]"
    if msg_type == "order":
        order = msg.get("order", {})
        items = order.get("product_items") or []
        return f"[Placed an order — {len(items)} item(s)]" if items else "[Placed an order]"
    if msg_type == "system":
        return (msg.get("system") or {}).get("body") or "[System notification]"
    if msg_type == "unsupported":
        # Meta's catch-all for content it can't relay to us (deleted/edited
        # messages, polls, etc). The real kind lives in `unsupported.type`,
        # not the top-level `errors` array.
        subtype = (msg.get("unsupported") or {}).get("type")
        if subtype in _UNSUPPORTED_SUBTYPE_LABELS:
            return _UNSUPPORTED_SUBTYPE_LABELS[subtype]
        errors = msg.get("errors") or []
        details = (errors[0].get("error_data") or {}).get("details") if errors else None
        if subtype:
            return f"[{subtype.replace('_', ' ').title()} — not supported by WhatsApp's API]"
        return f"[{details or 'Message type not supported by WhatsApp'}]"
    return f"[Unsupported message type: {msg_type}]"


def _handle_reaction(db: Session, wa_id: str, profile_name: str | None, msg: dict) -> None:
    """A tap-react (👍, ❤️, etc.) on an existing message. Attaches the emoji
    directly onto that message's MessageLog row — WhatsApp-style — instead
    of logging the reaction as its own separate chat bubble. An empty/
    missing emoji means the contact removed their reaction. Idempotent, so
    Meta's at-least-once webhook retries are harmless to re-apply."""
    reaction = msg.get("reaction") or {}
    target_provider_id = reaction.get("message_id")
    emoji = reaction.get("emoji") or None
    if not target_provider_id:
        return

    lead = _find_or_create_lead(db, wa_id, profile_name)
    target = (
        db.query(models.MessageLog)
        .filter_by(provider_id=target_provider_id, lead_id=lead.id)
        .first()
    )
    if target is not None:
        target.reaction_emoji = emoji
        db.commit()
        return

    # Couldn't match the original message (it predates this feature, or was
    # never logged for some other reason) — fall back to a standalone line
    # so the reaction isn't silently dropped.
    db.add(models.MessageLog(
        channel="whatsapp", lead_id=lead.id, to_address=lead.phone or f"+{wa_id}",
        body=f"{emoji} (reacted to a message)" if emoji else "Reacted to a message",
        trigger="inbound", status="received", direction="inbound",
    ))
    db.commit()


def _handle_inbound_messages(db: Session, value: dict) -> None:
    messages = value.get("messages") or []
    if not messages:
        return
    contacts = {c.get("wa_id"): (c.get("profile") or {}).get("name") for c in value.get("contacts", [])}

    for msg in messages:
        wa_id = msg.get("from")
        msg_id = msg.get("id")
        if not wa_id or not msg_id:
            continue

        if msg.get("type") == "reaction":
            _handle_reaction(db, wa_id, contacts.get(wa_id), msg)
            continue

        # De-dupe Meta's at-least-once webhook retries.
        already_logged = (
            db.query(models.MessageLog)
            .filter_by(provider_id=msg_id, direction="inbound")
            .first()
        )
        if already_logged:
            continue

        lead = _find_or_create_lead(db, wa_id, contacts.get(wa_id))
        old_stage = lead.stage

        msg_type = msg.get("type")
        media_asset_id = None
        media_type_field = None
        if msg_type in _MEDIA_FALLBACK_LABELS:
            media_info = msg.get(msg_type) or {}
            wa_media_id = media_info.get("id")
            caption = media_info.get("caption")
            if wa_media_id:
                media_asset_id, fallback_text = _store_inbound_media(db, wa_media_id, msg_type)
                body_text = caption or fallback_text
                media_type_field = msg_type
            else:
                body_text = _extract_text(msg)
        else:
            body_text = _extract_text(msg)

        db.add(models.MessageLog(
            channel="whatsapp",
            lead_id=lead.id,
            to_address=lead.phone or f"+{wa_id}",
            body=body_text,
            trigger="inbound",
            status="received",
            direction="inbound",
            media_id=media_asset_id,
            media_type=media_type_field,
            provider_id=msg_id,
        ))

        # A reply from the lead is at least as strong a signal of contact
        # as us messaging them first — same rule as the manual-send flow.
        if old_stage == 0:
            lead.stage = 1

        db.commit()


def _handle_status_updates(db: Session, value: dict) -> None:
    for status_event in value.get("statuses") or []:
        msg_id = status_event.get("id")
        new_status = status_event.get("status")  # sent, delivered, read, failed
        if not msg_id or new_status not in ("delivered", "read", "failed"):
            continue
        log = (
            db.query(models.MessageLog)
            .filter_by(provider_id=msg_id, direction="outbound")
            .first()
        )
        if not log:
            continue
        # Never downgrade a 'read' receipt back to 'delivered'.
        if log.status == "read" and new_status == "delivered":
            continue
        log.status = new_status
        if new_status == "failed":
            errors = status_event.get("errors") or []
            if errors:
                log.error = errors[0].get("title") or errors[0].get("message")
        db.commit()
