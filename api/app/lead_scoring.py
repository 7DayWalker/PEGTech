"""
AI-assisted lead scoring.

Populates the long-dormant `Lead.ai_score` field (0-100) using the
research notes, rating, email-confidence, and other signals the bulk
import feature already captures — the second roadmap item in
docs/ai-integration-plan.md, after the Daily Briefing.

Follows the same degrade-gracefully contract as briefing.py: if no AI
provider in the fallback chain answers (or returns something unusable),
this falls back to the existing rule-based `services.score_lead()` stub
rather than raising or leaving the lead unscored. Callers never need to
special-case "AI is down" — they always get a usable result dict back,
just with `ai_provider: None` when it was the rule-based fallback.
"""
from __future__ import annotations

import logging
from typing import Optional

from app import ai_client, models, services

logger = logging.getLogger("pegtech.lead_scoring")

_SYSTEM_PROMPT = (
    "You are a sales-operations assistant scoring inbound leads for a "
    "marketing/growth agency that serves home-services contractors "
    "(roofing, restoration, remodeling and similar trades). Score how "
    "promising a lead is to convert into a paying client, from 0 (dead "
    "end — don't bother) to 100 (call right now). Weigh: whether there's "
    "a working phone or email to even reach them, signs of an active, "
    "legitimate business (customer reviews, an existing web presence — "
    "note that an existing website can cut both ways: it may mean they "
    "don't need a new one, but it also proves they're a real, operating "
    "business worth prioritizing over one with no online footprint at "
    "all), any research flags (a note suggesting the business may be "
    "closed or defunct should score low; a note about an unclaimed "
    "listing or no digital presence is actually a good sign for this "
    "agency's services), and anything in the notes suggesting urgency or "
    "fit for the agency. Be decisive and specific to the lead in front of "
    "you — avoid defaulting every lead to the same middling score. "
    "Respond with ONLY a JSON object, no markdown fences, no commentary: "
    '{"ai_score": <int 0-100>, "tier": "HOT"|"WARM"|"COLD", '
    '"recommended_channel": "phone"|"email"|"whatsapp", '
    '"reasoning": "<one or two sentences, specific to this lead, for a '
    'human to read next to the score>"}'
)

_VALID_TIERS = {"HOT", "WARM", "COLD"}
_VALID_CHANNELS = {"phone", "email", "whatsapp"}

# Keep the research-notes block bounded — notes accumulate across
# re-uploads (briefing.py / lead_import.py) and a very long history
# shouldn't blow the prompt budget for what's ultimately a short score.
_MAX_NOTES_CHARS = 2000


def _build_prompt(lead: models.Lead) -> str:
    lines = [f"Business: {lead.business_name or lead.name}"]
    if lead.service:
        lines.append(f"Service/industry: {lead.service}")
    location = ", ".join(x for x in [lead.city, lead.state] if x)
    if location:
        lines.append(f"Location: {location}")
    lines.append(f"Phone on file: {'yes' if lead.phone else 'no'}")
    lines.append(
        f"Email on file: {'yes' if lead.email else 'no'}"
        f" (confidence: {lead.email_confidence or 'none'})"
    )
    lines.append(f"Website on file: {'yes' if lead.website else 'no'}")
    lines.append(f"Current deal-temperature tag (staff/import-set, not yours to change): {lead.score}")
    if lead.notes:
        notes = lead.notes.strip()
        if len(notes) > _MAX_NOTES_CHARS:
            notes = notes[:_MAX_NOTES_CHARS] + "\n[...truncated]"
        lines.append(f"Research notes:\n{notes}")
    return "\n".join(lines)


def _tier_for_score(ai_score: int) -> str:
    if ai_score >= 75:
        return "HOT"
    if ai_score >= 45:
        return "WARM"
    return "COLD"


def score_lead_ai(lead: models.Lead) -> dict:
    """Scores one lead. Always returns a usable dict:
    {ai_score: int, tier: str, recommended_channel: str, reasoning: str,
     ai_provider: str | None} — ai_provider is None when the rule-based
    fallback was used instead of a real model."""
    prompt = _build_prompt(lead)
    result = ai_client.ai_complete_json(
        prompt, system=_SYSTEM_PROMPT, temperature=0.3, max_tokens=300,
    )

    if result is not None:
        try:
            ai_score = int(result["ai_score"])
            ai_score = max(0, min(100, ai_score))
            tier = str(result.get("tier", "")).strip().upper()
            if tier not in _VALID_TIERS:
                tier = _tier_for_score(ai_score)
            channel = str(result.get("recommended_channel", "")).strip().lower()
            if channel not in _VALID_CHANNELS:
                channel = "phone" if tier == "HOT" else "email"
            reasoning = str(result.get("reasoning", "")).strip()[:500]
            if not reasoning:
                reasoning = "AI scoring ran but returned no explanation."
            return {
                "ai_score": ai_score,
                "tier": tier,
                "recommended_channel": channel,
                "reasoning": reasoning,
                "ai_provider": result.get("_ai_provider"),
            }
        except (KeyError, TypeError, ValueError) as e:
            logger.warning(
                "score_lead_ai: malformed AI response for lead %s, falling back to rule-based (%s)",
                lead.id, e,
            )

    # No provider answered, or the answer was unusable — degrade to the
    # existing rule-based stub rather than leaving the lead unscored.
    fallback = services.score_lead(
        lead_name=lead.name,
        business_name=lead.business_name,
        industry=lead.service,
        website=lead.website,
        notes=lead.notes,
    )
    return {
        "ai_score": fallback["score"],
        "tier": fallback["tier"],
        "recommended_channel": fallback["recommended_channel"],
        "reasoning": fallback["reasoning"],
        "ai_provider": None,
    }
