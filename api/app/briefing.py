"""
Daily Briefing — "what needs attention today" for the staff Dashboard.

Built rule-based first (zero AI cost, uses data the app already has) per
the AI integration plan: ship the useful thing immediately, then layer an
optional one-line AI summary on top using the provider-agnostic ai_client,
degrading silently to just the rule-based items if no AI provider answers.
"""
from __future__ import annotations

import time
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app import ai_client, models

_STALE_HOURS = 24
_MAX_ITEMS_PER_CATEGORY = 8

# Deterministic substrings our own lead_import.py writes into a lead's
# notes when its research flagged something worth a human double-check —
# matched here, not re-derived, so this stays in lockstep with whatever
# exact wording lead_import.py uses.
# Keyed on what lead_import.py actually writes into a lead's notes (the
# raw marker value after "Website check: ", via its _build_notes()) — NOT
# the human-readable warning sentence, which only ever appears in the
# one-time import API response and is never persisted to the database.
# Confirmed by direct inspection: a real imported lead's notes contained
# "Website check: website_found", not the word "existing" anywhere, so
# matching on the readable phrase here always missed every flagged lead
# with zero errors or indication anything was wrong.
_IMPORT_FLAG_MARKERS = {
    "Website check: website_found": "an existing website",
    "Website check: out_of_business": "possibly out of business",
}

# Tiny in-process cache so repeated dashboard loads within a few minutes
# don't each trigger a fresh AI call — the underlying data rarely changes
# that fast, and this is a cost control, not a correctness requirement.
_AI_SUMMARY_CACHE: dict[str, tuple[float, Optional[str], Optional[str]]] = {}
_AI_SUMMARY_TTL_SECONDS = 600


def _ever_contacted_lead_ids(db: Session, lead_ids: list[int]) -> set[int]:
    if not lead_ids:
        return set()
    rows = (
        db.query(models.MessageLog.lead_id)
        .filter(models.MessageLog.lead_id.in_(lead_ids))
        .filter(models.MessageLog.direction == "outbound")
        .distinct()
        .all()
    )
    return {r[0] for r in rows}


def build_briefing(db: Session, with_ai_summary: bool = True) -> dict:
    now = datetime.utcnow()
    stale_cutoff = now - timedelta(hours=_STALE_HOURS)

    items: list[dict] = []

    # 1. Stale hot leads — still New (stage 0), scored HOT, sitting for
    # more than _STALE_HOURS, and never actually contacted yet.
    hot_candidates = (
        db.query(models.Lead)
        .filter(models.Lead.score == "HOT")
        .filter(models.Lead.stage == 0)
        .filter(models.Lead.created_at < stale_cutoff)
        .order_by(models.Lead.created_at.asc())
        .limit(50)
        .all()
    )
    contacted = _ever_contacted_lead_ids(db, [l.id for l in hot_candidates])
    stale_hot = [l for l in hot_candidates if l.id not in contacted][:_MAX_ITEMS_PER_CATEGORY]
    for lead in stale_hot:
        age_hours = int((now - lead.created_at).total_seconds() // 3600)
        items.append({
            "type": "stale_hot_lead",
            "severity": "high",
            "lead_id": lead.id,
            "title": f"{lead.business_name or lead.name} — hot lead, {age_hours}h uncontacted",
            "detail": "Scored HOT on import/scoring but still sitting in New with no outreach sent yet.",
        })

    # 2. Leads flagged during research/import worth a human glance before
    # outreach (business may already have a site, or may be defunct).
    flagged_candidates = (
        db.query(models.Lead)
        .filter(models.Lead.stage == 0)
        .filter(models.Lead.notes.isnot(None))
        .order_by(models.Lead.created_at.desc())
        .limit(200)
        .all()
    )
    flagged_count = 0
    for lead in flagged_candidates:
        if flagged_count >= _MAX_ITEMS_PER_CATEGORY:
            break
        notes = lead.notes or ""
        for marker, label in _IMPORT_FLAG_MARKERS.items():
            if marker in notes:
                items.append({
                    "type": "import_flag",
                    "severity": "medium",
                    "lead_id": lead.id,
                    "title": f"{lead.business_name or lead.name} — check before outreach",
                    "detail": f"Research flagged {label} for this lead.",
                })
                flagged_count += 1
                break

    # 3. Unread inbound messages (leads + clients) — reuses the same
    # has_unread definition as the Leads/Clients list badges.
    unread_leads = (
        db.query(models.Lead.id, models.Lead.name, models.Lead.business_name)
        .join(models.MessageLog, models.MessageLog.lead_id == models.Lead.id)
        .filter(models.MessageLog.direction == "inbound")
        .filter((models.Lead.last_read_at.is_(None)) | (models.MessageLog.created_at > models.Lead.last_read_at))
        .distinct()
        .limit(_MAX_ITEMS_PER_CATEGORY)
        .all()
    )
    for lead_id, name, business_name in unread_leads:
        items.append({
            "type": "unread_message",
            "severity": "medium",
            "lead_id": lead_id,
            "title": f"{business_name or name} — unread reply",
            "detail": "This lead has a new inbound message waiting in the Message Center.",
        })

    unread_clients = (
        db.query(models.Client.id, models.Client.company)
        .join(models.MessageLog, models.MessageLog.client_id == models.Client.id)
        .filter(models.MessageLog.direction == "inbound")
        .filter((models.Client.last_read_at.is_(None)) | (models.MessageLog.created_at > models.Client.last_read_at))
        .distinct()
        .limit(_MAX_ITEMS_PER_CATEGORY)
        .all()
    )
    for client_id, company in unread_clients:
        items.append({
            "type": "unread_message",
            "severity": "medium",
            "client_id": client_id,
            "title": f"{company} — unread reply",
            "detail": "This client has a new inbound message waiting in the Message Center.",
        })

    # 4. Pending escalations.
    escalations = (
        db.query(models.Escalation)
        .filter(models.Escalation.status == "queued")
        .order_by(models.Escalation.created_at.asc())
        .limit(_MAX_ITEMS_PER_CATEGORY)
        .all()
    )
    for esc in escalations:
        items.append({
            "type": "pending_escalation",
            "severity": "high",
            "escalation_id": esc.id,
            "client_id": esc.client_id,
            "title": esc.reason or "Escalation needs attention",
            "detail": esc.summary,
        })

    result = {
        "generated_at": now.isoformat() + "Z",
        "items": items,
        "counts": {
            "stale_hot_leads": len(stale_hot),
            "import_flags": flagged_count,
            "unread_messages": len(unread_leads) + len(unread_clients),
            "pending_escalations": len(escalations),
        },
        "ai_summary": None,
        "ai_provider": None,
    }

    if with_ai_summary and items:
        summary, provider = _get_ai_summary(result["counts"], items)
        result["ai_summary"] = summary
        result["ai_provider"] = provider

    return result


def _get_ai_summary(counts: dict, items: list[dict]) -> tuple[Optional[str], Optional[str]]:
    """One short natural-language sentence summarizing today's briefing,
    cached briefly to keep repeated dashboard loads cheap. Returns
    (summary_or_None, provider_or_None) — None means no AI provider
    answered, and the caller just shows the rule-based items with no
    summary line, not an error."""
    # Keyed on the actual set of item identities (not just counts) — two
    # different situations that happen to have the same counts per
    # category (e.g. "1 stale hot lead" today vs. a completely different
    # lead tomorrow) must NOT share a cached summary describing the wrong
    # business.
    identity = tuple(sorted(
        (i.get("lead_id"), i.get("client_id"), i.get("escalation_id"), i["type"]) for i in items
    ))
    cache_key = str(identity)
    cached = _AI_SUMMARY_CACHE.get(cache_key)
    now = time.monotonic()
    if cached and (now - cached[0]) < _AI_SUMMARY_TTL_SECONDS:
        return cached[1], cached[2]

    examples = "; ".join(i["title"] for i in items[:6])
    prompt = (
        "You're writing a single short sentence (max ~25 words) for a sales team's morning "
        "dashboard, summarizing what needs attention today. Be direct and specific, no greeting, "
        "no 'Hello', just the one sentence.\n\n"
        f"Counts: {counts}\nExamples: {examples}"
    )
    result = ai_client.ai_complete(prompt, temperature=0.4, max_tokens=80)
    summary = result.text.strip() if result else None
    provider = result.provider if result else None
    _AI_SUMMARY_CACHE[cache_key] = (now, summary, provider)

    # Opportunistic cleanup so this dict doesn't grow unbounded over a
    # long-running server's lifetime — every distinct day's lead/client ID
    # combination would otherwise add a new entry that's never removed.
    expired = [k for k, v in _AI_SUMMARY_CACHE.items() if (now - v[0]) >= _AI_SUMMARY_TTL_SECONDS]
    for k in expired:
        _AI_SUMMARY_CACHE.pop(k, None)

    return summary, provider
