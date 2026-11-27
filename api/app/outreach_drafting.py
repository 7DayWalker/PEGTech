"""
AI-drafted outreach — one-click real email/WhatsApp drafts per lead.

Third roadmap item in docs/ai-integration-plan.md (§2.3), after the Daily
Briefing and AI lead scoring. Pulls in a lead's research notes so the
draft references something specific to that business ("no website found"
-> "that's exactly where we can help") instead of the fully generic
template in services.draft_email(), which remains the fallback tier here
when no AI provider answers.
"""
from __future__ import annotations

import logging
import re
from typing import Optional

from app import ai_client, models, services

logger = logging.getLogger("pegtech.outreach_drafting")

_MAX_NOTES_CHARS = 2000

_EMAIL_SYSTEM_PROMPT = (
    "You are a sales rep at PEGTech, a growth/marketing agency that helps "
    "home-services contractors (roofing, restoration, remodeling and "
    "similar trades) get more customers — services include websites, lead "
    "generation, and local SEO/Google Business presence. Write a short, "
    "warm, professional first-touch outreach EMAIL to a prospect business, "
    "referencing something SPECIFIC about them from the research notes "
    "given (their rating/reviews, whether they have a website, an "
    "unclaimed listing, anything suggesting fit) so it doesn't read as a "
    "generic template. Keep it genuinely short — 3 short paragraphs at "
    "most. End with a clear, low-friction call to action (e.g. a brief "
    "call). Do NOT commit to specific prices, contract terms, timelines, "
    "or guarantees — those are discussed on a call, not promised cold. "
    "Respond with ONLY a JSON object, no markdown fences, no commentary: "
    '{"subject": "<short subject line>", '
    '"body_html": "<the email body as simple HTML using only <p> and <br> '
    'tags — no inline styles, no images, no markdown>"}'
)

_WHATSAPP_SYSTEM_PROMPT = (
    "You are a sales rep at PEGTech, a growth/marketing agency that helps "
    "home-services contractors (roofing, restoration, remodeling and "
    "similar trades) get more customers. Write a short, casual-but-"
    "professional first-touch WhatsApp message to a prospect business, "
    "referencing something SPECIFIC about them from the research notes "
    "given, so it doesn't read as a generic template or spam. WhatsApp "
    "messages are read on a phone — keep it to 2-4 short sentences, no "
    "subject line, no formal letter structure. End with a low-friction "
    "question or call to action. Do NOT commit to specific prices, "
    "contract terms, timelines, or guarantees. "
    "Respond with ONLY a JSON object, no markdown fences, no commentary: "
    '{"body": "<the plain-text WhatsApp message>"}'
)

_VALID_CHANNELS = {"email", "whatsapp"}


def _build_prompt(lead: models.Lead, key_points: Optional[str]) -> str:
    lines = [f"Business: {lead.business_name or lead.name}"]
    if lead.name and lead.name != lead.business_name:
        lines.append(f"Contact name (use if it reads naturally, otherwise address the business): {lead.name}")
    if lead.service:
        lines.append(f"Service/industry: {lead.service}")
    location = ", ".join(x for x in [lead.city, lead.state] if x)
    if location:
        lines.append(f"Location: {location}")
    if lead.website:
        lines.append("They already have a website on file.")
    if lead.notes:
        notes = lead.notes.strip()
        if len(notes) > _MAX_NOTES_CHARS:
            notes = notes[:_MAX_NOTES_CHARS] + "\n[...truncated]"
        lines.append(f"Research notes:\n{notes}")
    if key_points:
        lines.append(f"Staff-requested talking points to include: {key_points.strip()}")
    return "\n".join(lines)


def _strip_html(html: str) -> str:
    return re.sub(r"<[^>]+>", " ", html).strip()


def _fallback_whatsapp(lead: models.Lead) -> str:
    """Rule-based WhatsApp draft for when no AI provider answers — there's
    no existing stub for this channel in services.py (only draft_email),
    so this is a small dedicated fallback rather than reusing the email
    template verbatim, which would read oddly as a text message."""
    business = lead.business_name or lead.name
    service_line = f" with your {lead.service.lower()} business" if lead.service else " with your business"
    return (
        f"Hi {lead.name or business}! This is PEGTech — we help businesses "
        f"like {business} get more customers online. Would you be open to "
        f"a quick chat this week about how we could help{service_line}?"
    )


def draft_outreach_ai(lead: models.Lead, channel: str, key_points: Optional[str] = None) -> dict:
    """Returns {subject: str | None, body: str, ai_provider: str | None}.
    `body` is HTML for email (to match how the email send path already
    treats the compose box's body as body_html — see notifications.
    send_lead_email) and plain text for whatsapp. ai_provider is None
    when the rule-based fallback was used instead of a real model."""
    channel = channel.strip().lower()
    if channel not in _VALID_CHANNELS:
        raise ValueError(f"Unknown channel: {channel!r} (expected 'email' or 'whatsapp')")

    prompt = _build_prompt(lead, key_points)
    system = _EMAIL_SYSTEM_PROMPT if channel == "email" else _WHATSAPP_SYSTEM_PROMPT
    result = ai_client.ai_complete_json(prompt, system=system, temperature=0.6, max_tokens=500)

    if result is not None:
        try:
            if channel == "email":
                subject = str(result["subject"]).strip()
                body = str(result["body_html"]).strip()
                if not subject or not body:
                    raise ValueError("empty subject or body")
                return {"subject": subject, "body": body, "ai_provider": result.get("_ai_provider")}
            else:
                body = str(result["body"]).strip()
                if not body:
                    raise ValueError("empty body")
                return {"subject": None, "body": body, "ai_provider": result.get("_ai_provider")}
        except (KeyError, TypeError, ValueError) as e:
            logger.warning(
                "draft_outreach_ai: malformed AI response for lead %s/%s, falling back to rule-based (%s)",
                lead.id, channel, e,
            )

    # No provider answered, or the answer was unusable — degrade to the
    # existing rule-based template rather than leaving the draft empty.
    if channel == "email":
        fallback = services.draft_email(
            lead_name=lead.name, business_name=lead.business_name,
            service=lead.service, key_points=key_points,
        )
        return {"subject": fallback["subject"], "body": fallback["body_html"], "ai_provider": None}
    else:
        return {"subject": None, "body": _fallback_whatsapp(lead), "ai_provider": None}
