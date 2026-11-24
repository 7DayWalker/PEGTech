"""
Domain logic — pure and unit-testable, including AI service helpers.
"""
from datetime import date, timedelta, timezone
from typing import List, Tuple, Optional
from app.config import BUSINESS_DAYS, SLOTS, AI_DEFAULT_MODEL


# ── Revenue-Leak Audit model (audit-v1) ──
LEAD_MID = {"Under 50": 30, "50 – 150": 100, "150 – 400": 265, "400+": 520}
RESPONSE_MULT = {"Under 5 mins": 0.35, "Under 1 hour": 0.6, "Same day": 1.0, "Next day +": 1.6}
PIPE_MULT = {"CRM / system": 0.7, "Spreadsheet": 0.9, "Inbox / DMs only": 1.15, "Nothing structured": 1.4}
DEAL_MID = {"Under $250": 150, "$250 – $1,500": 850, "$1,500 – $6,000": 3600, "$6,000+": 11000}
BASE_LEAK_FRACTION = 0.12


def compute_audit(industry: str, leads: str, response: str, pipeline: str, deal: str) -> dict:
    leads_mid = LEAD_MID[leads]
    resp = RESPONSE_MULT[response]
    pipe = PIPE_MULT[pipeline]
    deal_mid = DEAL_MID[deal]
    leak_fraction = min(0.85, BASE_LEAK_FRACTION * resp * pipe)
    annual = leads_mid * 12 * deal_mid * leak_fraction
    monthly = annual / 12
    ad_waste = annual * 0.18
    risk_pct = min(95, round(leak_fraction / 0.85 * 100))
    return {
        "annual_leak_usd": round(annual, 2),
        "monthly_leak_usd": round(monthly, 2),
        "ad_waste_usd": round(ad_waste, 2),
        "risk_pct": int(risk_pct),
    }


# ── Booking availability engine ──
def availability(today: date, days: int = 21) -> dict[str, list[str]]:
    return {d.isoformat(): list(SLOTS) for d in iter_slot_days(today, days)}


def iter_slot_days(today: date, days: int):
    d = today
    seen = 0
    while seen < days:
        if d.weekday() in BUSINESS_DAYS and d >= today:
            yield d
            seen += 1
        d += timedelta(days=1)


def slot_is_supported(day: date, slot: str) -> bool:
    return day.weekday() in BUSINESS_DAYS and slot in SLOTS


# ── AI: lead scoring (rule-based + LLM-ready) ──
INTERVIEW_QUESTIONS = [
    "Tell us who you are and what customer-facing experience you bring.",
    "Scenario: a customer says they will pay “tomorrow” for the third time. What do you do?",
    "It is 4pm and you are 40 messages behind. How do you triage — and what never waits until tomorrow?",
    "What does “managed” mean to you when a client’s revenue depends on your follow-through?",
    "When can you start, and which hours do you do your best work in?",
]

RELIABILITY_WORDS = ("call", "confirm", "escalat", "log", "record", "deadline", "sla", "promise")


def flag_answer(text: str) -> List[str]:
    flags = []
    words = text.split()
    if len(words) < 8:
        flags.append("thin-answer")
    if not any(w in text.lower() for w in RELIABILITY_WORDS):
        flags.append("no-ownership-language")
    return flags


def score_lead(lead_name: str, business_name: Optional[str] = None,
               industry: Optional[str] = None, website: Optional[str] = None,
               notes: Optional[str] = None) -> dict:
    """Score a lead 0-100 using rule-based signals. LLM can enhance this."""
    score = 50
    reasoning = []

    if business_name:
        score += 10
        reasoning.append("Has a registered business name")
    if industry:
        score += 10
        reasoning.append(f"Industry identified: {industry}")
    if website:
        score += 10
        reasoning.append("Has a website — digital presence established")
    if notes and len(notes) > 50:
        score += 10
        reasoning.append("Detailed notes provided — engaged prospect")
    if phone_has_value := False:
        pass

    # Cap at 100
    score = min(100, max(0, score))

    if score >= 75:
        tier = "HOT"
    elif score >= 45:
        tier = "WARM"
    else:
        tier = "COLD"

    channel_map = {"HOT": "phone", "WARM": "email", "COLD": "email"}
    recommended_channel = channel_map[tier]

    return {
        "score": score,
        "tier": tier,
        "reasoning": "; ".join(reasoning) or "Limited data — recommend initial discovery call",
        "recommended_channel": recommended_channel,
    }


# ── AI: email drafting (template-based, LLM-enhanceable) ──
def draft_email(lead_name: str, business_name: Optional[str] = None,
                service: Optional[str] = None, tone: str = "professional",
                key_points: Optional[str] = None) -> dict:
    """Draft an outreach email. LLM can enhance this."""
    tone_openings = {
        "professional": f"Dear {lead_name},",
        "friendly": f"Hi {lead_name},",
        "casual": f"Hey {lead_name},",
    }
    opening = tone_openings.get(tone, tone_openings["professional"])

    service_line = f" our {service} services" if service else " our services"
    business_line = f" at {business_name}" if business_name else ""

    body = f"""{opening}

I hope you're doing well. I'm reaching out from PEGTech because we specialize in{service_line} that help businesses like{business_line} grow more efficiently.

{f"Key points: {key_points}" if key_points else ""}

Would you be open to a brief 15-minute call next week to explore how we can help?

Best regards,
The PEGTech Team"""

    return {
        "subject": f"Helping {business_name or lead_name} with {service or 'digital services'}",
        "body_text": body,
        "body_html": body.replace("\n", "<br>"),
    }


# ── AI: call summarization (rule-based, LLM-enhanceable) ──
def summarize_call(transcript: str, speaker_names: Optional[str] = None) -> dict:
    """Summarize a call transcript. LLM can enhance this."""
    lines = transcript.split("\n")
    word_count = len(transcript.split())

    # Simple heuristics
    action_keywords = ("will", "going to", "plan to", "need to", "should", "must", "follow up", "send", "call back")
    action_items = []
    for line in lines:
        if any(k in line.lower() for k in action_keywords):
            action_items.append(line.strip()[:200])

    sentiment = "neutral"
    positive_words = ("great", "excited", "happy", "satisfied", "pleased", "thank")
    negative_words = ("angry", "frustrated", "upset", "disappointed", "terrible", "worst")
    pos_count = sum(1 for w in positive_words if w in transcript.lower())
    neg_count = sum(1 for w in negative_words if w in transcript.lower())
    if pos_count > neg_count:
        sentiment = "positive"
    elif neg_count > pos_count:
        sentiment = "negative"

    key_topics = []
    topic_keywords = {
        "pricing": ("price", "cost", "budget", "quote", "fee"),
        "timeline": ("deadline", "schedule", "timeline", "when", "date"),
        "scope": ("scope", "include", "deliverable", "feature", "requirement"),
    }
    for topic, keywords in topic_keywords.items():
        if any(k in transcript.lower() for k in keywords):
            key_topics.append(topic)

    summary = f"Call transcript ({word_count} words) discussed project requirements."
    if speaker_names:
        summary += f" Participants: {speaker_names}."

    return {
        "summary": summary,
        "action_items": action_items[:5],
        "sentiment": sentiment,
        "key_topics": key_topics,
    }


# ── AI: meeting assistant ──
def meeting_assistant(transcript: str, meeting_type: str = "general") -> dict:
    """Extract action items, decisions, and follow-ups from a meeting transcript."""
    result = summarize_call(transcript)
    return {
        "summary": result["summary"],
        "action_items": result["action_items"],
        "decisions": [line for line in transcript.split("\n") if "decided" in line.lower() or "agreed" in line.lower()][:5],
        "follow_ups": [line for line in transcript.split("\n") if "follow up" in line.lower() or "next steps" in line.lower()][:5],
    }


# ── AI: proposal generator (template-based) ──
def generate_proposal(client_name: str, project_name: str, services: str,
                      timeline_weeks: Optional[int] = None,
                      budget_usd: Optional[float] = None) -> dict:
    """Generate a project proposal."""
    timeline = f"{timeline_weeks} weeks" if timeline_weeks else "To be determined"
    budget = f"${budget_usd:,.0f}" if budget_usd else "To be quoted"

    proposal = f"""# Project Proposal: {project_name}

## Prepared for: {client_name}

### Overview
This proposal outlines the {services} project for {client_name}.

### Scope of Work
{services}

### Timeline
Estimated duration: {timeline}

### Investment
Estimated budget: {budget}

### Next Steps
1. Review and approve this proposal
2. Schedule a kickoff call
3. Begin project execution

Prepared by PEGTech — Your partner in digital growth."""

    return {
        "proposal_text": proposal,
        "estimated_timeline": timeline,
        "estimated_budget": budget,
        "key_deliverables": [s.strip() for s in services.split(",") if s.strip()],
    }


# ── AI: content generator (template-based) ──
def generate_content(topic: str, content_type: str, tone: str = "professional",
                     target_audience: Optional[str] = None,
                     key_points: Optional[str] = None) -> dict:
    """Generate marketing content."""
    audience = f" for {target_audience}" if target_audience else ""
    points = f"\n\nKey points to cover:\n{key_points}" if key_points else ""

    content = f"""# {topic}

## {tone.title()} {content_type.title()}{audience}

{points}

---

This content was generated by PEGTech AI. Review and customize before publishing."""

    seo_keywords = [topic.lower(), content_type, "pegtech", "digital services"]
    meta_desc = f"Professional {content_type} about {topic} by PEGTech."

    return {
        "title": topic,
        "content": content,
        "seo_keywords": seo_keywords,
        "meta_description": meta_desc,
    }


# ── AI: CSR response ──
def csr_response(message: str, history: List[dict]) -> dict:
    """AI Customer Service Representative — first response before human joins."""
    greeting = "Hello! I'm PEGTech's AI assistant. How can I help you today?"

    # Simple intent detection
    lower = message.lower()
    if any(w in lower for w in ("price", "cost", "quote", "pricing")):
        intent = "pricing_inquiry"
        response = "I'd be happy to help with pricing! Could you tell me which service you're interested in? We offer web development, AI solutions, digital marketing, and more."
    elif any(w in lower for w in ("book", "schedule", "appointment", "call")):
        intent = "booking_request"
        response = "I can help you schedule a call. What type of service are you looking for, and do you have a preferred date/time?"
    elif any(w in lower for w in ("support", "help", "issue", "problem")):
        intent = "support_request"
        response = "I'm sorry to hear you're having an issue. Could you describe what's happening so I can connect you with the right team member?"
    elif any(w in lower for w in ("career", "job", "hiring", "apply")):
        intent = "career_inquiry"
        response = "We're always looking for talented people! Visit our careers page to see open positions and apply."
    else:
        intent = "general_inquiry"
        response = greeting

    return {
        "intent": intent,
        "response": response,
        "escalate": intent in ("support_request",) and any(w in lower for w in ("angry", "frustrated", "upset")),
    }
