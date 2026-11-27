"""
AI-powered public CSR (customer service rep) chat widget.

Phase 2 of docs/ai-integration-plan.md (section 3): replaces the
keyword-matching `services.csr_response()` stub with a real model call
through the fallback-chain client built in Phase 1 (`ai_client.py`).

This is the one AI surface a total stranger can hit directly, with no
login and no cost to them, so it carries two constraints the staff-side
AI features (lead scoring, outreach drafting, escalation summaries)
don't:

1. A guardrailed system prompt — no price commitments, no contract/legal
   promises, no made-up facts about PEGTech, and clear instructions on
   when to hand off to a human (the `escalate` flag, which already wires
   into the real Escalation pipeline from Phase 1 step 4 via
   routers/chat.py).
2. The rule-based `services.csr_response()` stays wired in as the final
   fallback tier — on any AI failure (no provider configured, every
   chain tier down, or an unparseable/invalid response) this quietly
   drops back to keyword matching instead of ever erroring out to a
   visitor or going silent.

Rate limiting against abuse lives separately in rate_limit.py / applied
in routers/chat.py, since that's a transport-layer concern rather than a
response-generation one.
"""
from __future__ import annotations

import logging

from app import services
from app.ai_client import ai_complete_json

logger = logging.getLogger("pegtech.csr_ai")

_VALID_INTENTS = {
    "pricing_inquiry",
    "booking_request",
    "support_request",
    "career_inquiry",
    "general_inquiry",
}

_MAX_HISTORY_TURNS = 8  # trailing turns of context sent to the model

_SYSTEM_PROMPT = (
    "You are the AI customer service assistant on PEGTech's public "
    "website — pegtech.co. PEGTech is a digital agency building web apps, "
    "mobile apps, AI solutions (including this chat widget, AI lead "
    "scoring, and AI-drafted outreach for clients), and digital marketing "
    "for businesses, with a particular focus on home-services contractors "
    "(roofing, restoration, etc.) in Nigeria and internationally. The "
    "site also has a free 'Revenue-Leak Audit' calculator at /audit, a "
    "careers page at /careers, and a 'Book a Call' flow at /book.\n\n"
    "You are talking to an anonymous website visitor, not a logged-in "
    "client, inside an embedded chat widget. Hard rules, no exceptions:\n"
    "- NEVER state a specific price, dollar figure, or quote. If asked "
    "about cost, describe the service categories and offer to book a "
    "call or run the free Revenue-Leak Audit at /audit for a tailored "
    "estimate — a human will give an actual number.\n"
    "- If the visitor wants to book/schedule a call, do NOT paste a raw "
    "URL or say you can't make links clickable — a booking form opens "
    "automatically right inside this chat whenever intent is "
    "booking_request, so just confirm you're pulling that up for them "
    '(e.g. "Sure — I\'ve opened a quick booking form below, pick a time '
    'that works.").\n'
    "- When you do mention /audit, /careers, or /book, write them as the "
    "bare path (e.g. '/audit') — the chat UI auto-links them, so never "
    "wrap them in markdown or explain you can't hyperlink them.\n"
    "- NEVER promise a specific delivery date/timeline, make a contractual "
    "commitment, or state a legal/compliance guarantee.\n"
    "- NEVER invent facts about PEGTech (team size, specific past clients, "
    "certifications, etc.) that aren't given to you here. If you don't "
    "know something, say a team member can answer that and offer to flag "
    "it for follow-up.\n"
    "- Keep replies short and conversational: 1-3 sentences, no bullet "
    "lists, no markdown.\n"
    "- Set escalate=true whenever the visitor is frustrated, angry, "
    "describes an unresolved problem with existing work, explicitly asks "
    "for a human, or raises anything legal/contractual/a complaint. "
    "Otherwise escalate=false.\n"
    "- Whenever you set escalate=true AND the conversation so far hasn't "
    "already given you an email or phone number, your reply MUST ask for "
    "the best email or phone number to reach them at, in the same "
    "sentence as acknowledging you're flagging this for the team "
    '(e.g. "I\'m flagging this for our team right now — what\'s the best '
    'email or number for them to reach you on?"). A teammate follows up '
    "directly by phone/email/WhatsApp, they do not join this chat window "
    "— never say or imply a human is about to appear inside this same "
    "conversation. If an email or phone number is already visible earlier "
    "in the conversation, skip asking again and just confirm you're "
    "flagging it.\n"
    "- Classify intent as exactly one of: pricing_inquiry, "
    "booking_request, support_request, career_inquiry, general_inquiry.\n\n"
    "Respond with ONLY a JSON object, no markdown fences, no commentary: "
    '{"response": "<your reply>", "intent": "<one of the five intents>", '
    '"escalate": <true or false>}'
)


def _build_prompt(message: str, history: list[dict]) -> str:
    lines: list[str] = []
    trimmed = history[-(_MAX_HISTORY_TURNS * 2):] if history else []
    for turn in trimmed:
        role = "Visitor" if turn.get("role") == "user" else "Assistant"
        content = str(turn.get("content", "")).strip()
        if content:
            lines.append(f"{role}: {content}")
    lines.append(f"Visitor: {message}")
    lines.append(
        "\nRespond to the visitor's latest message above, with the "
        "conversation history for context, as the JSON object described "
        "in your system instructions."
    )
    return "\n".join(lines)


def csr_response_ai(message: str, history: list[dict]) -> dict:
    """Returns {intent, response, escalate} — same shape as
    services.csr_response() so routers/chat.py needs no changes beyond
    the import. Falls back to the rule-based stub on any AI failure."""
    fallback = services.csr_response(message, history)

    prompt = _build_prompt(message, history or [])
    result = ai_complete_json(prompt, system=_SYSTEM_PROMPT, temperature=0.4, max_tokens=300)
    if result is None:
        logger.info("csr_response_ai: no AI provider answered, using rule-based fallback")
        return fallback

    try:
        response_text = str(result["response"]).strip()
        if not response_text:
            raise ValueError("empty response text")
        intent = str(result.get("intent", "general_inquiry")).strip()
        if intent not in _VALID_INTENTS:
            intent = "general_inquiry"
        escalate = bool(result.get("escalate", False))
    except (KeyError, TypeError, ValueError) as e:
        logger.warning("csr_response_ai: AI response missing/invalid fields (%s), using rule-based fallback", e)
        return fallback

    return {"intent": intent, "response": response_text, "escalate": escalate}
