"""
AI summarization of flagged escalations.

Fourth roadmap item in docs/ai-integration-plan.md (section 2.4): "AI
summary of flagged conversations shown in the Dashboard's escalations
alert instead of a raw count." Runs AFTER an Escalation row already
exists (created by either the CSR widget or an inbound client WhatsApp
message flagged by escalation_detection.py) — this module only turns
that raw flag into something readable for staff, it doesn't decide
whether something is escalation-worthy in the first place.
"""
from __future__ import annotations

import logging

from app import ai_client, models

logger = logging.getLogger("pegtech.escalation_summary")

_MAX_TRANSCRIPT_CHARS = 2000

_SYSTEM_PROMPT = (
    "You are a support-operations assistant at PEGTech, an agency serving "
    "home-services contractor clients, plus running a public website that "
    "talks to prospective customers. You're given a conversation that was "
    "flagged as needing a human staff member's attention — either from an "
    "existing client or a website visitor. Write ONE or TWO sentences for "
    "a staff member glancing at a dashboard: what's actually wrong, and "
    "what they should do about it. Be concrete and specific to what's in "
    "the conversation — do not write something generic that could apply "
    "to any escalation. Respond with ONLY a JSON object, no markdown "
    'fences, no commentary: {"summary": "<one or two sentences>"}'
)


def _build_prompt(escalation: models.Escalation) -> str:
    lines = [f"Source: {escalation.source}", f"Flagged reason: {escalation.reason}"]
    if escalation.sentiment:
        lines.append(f"Detected sentiment: {escalation.sentiment}")
    transcript = (escalation.transcript or escalation.summary or "").strip()
    if len(transcript) > _MAX_TRANSCRIPT_CHARS:
        transcript = transcript[:_MAX_TRANSCRIPT_CHARS] + "\n[...truncated]"
    lines.append(f"Conversation / message:\n{transcript}")
    return "\n".join(lines)


def summarize_escalation_ai(escalation: models.Escalation) -> dict:
    """Returns {ai_summary: str, ai_provider: str | None}. Falls back to
    the escalation's own `summary` field (already written at creation
    time, before this ever runs) when no AI provider answers — this
    never leaves ai_summary empty for staff to see."""
    prompt = _build_prompt(escalation)
    result = ai_client.ai_complete_json(prompt, system=_SYSTEM_PROMPT, temperature=0.3, max_tokens=200)
    if result is not None:
        try:
            summary = str(result["summary"]).strip()
            if summary:
                return {"ai_summary": summary, "ai_provider": result.get("_ai_provider")}
        except (KeyError, TypeError, ValueError) as e:
            logger.warning(
                "summarize_escalation_ai: malformed AI response for escalation %s (%s)",
                escalation.id, e,
            )
    return {"ai_summary": escalation.summary, "ai_provider": None}


def summarize_and_save_background(escalation_id: int) -> None:
    """Background-task entry point used by both the CSR widget endpoint
    and the inbound WhatsApp webhook — both need to return their response
    fast (a visitor waiting on a chat reply; Meta's webhook retrying
    aggressively on slow/non-200 responses), so the AI call happens after
    that response is already sent, in its own DB session."""
    from app.db import SessionLocal

    db = SessionLocal()
    try:
        esc = db.get(models.Escalation, escalation_id)
        if esc is None:
            return
        result = summarize_escalation_ai(esc)
        esc.ai_summary = result["ai_summary"]
        esc.ai_summary_provider = result["ai_provider"]
        db.commit()
    except Exception as e:  # noqa: BLE001 — background task must never raise
        logger.warning("summarize_and_save_background failed for escalation %s: %s", escalation_id, e)
    finally:
        db.close()
