"""
AI services — LLM-powered features for PEGTech.
"""
import json
import httpx
from typing import Optional, List, Dict, Any
from app.config import OPENAI_API_KEY, ANTHROPIC_API_KEY, AI_DEFAULT_MODEL


async def llm_complete(prompt: str, system: Optional[str] = None,
                       model: Optional[str] = None, temperature: float = 0.7,
                       max_tokens: int = 1000) -> str:
    """Generic LLM completion via OpenAI or Anthropic."""
    model = model or AI_DEFAULT_MODEL

    if OPENAI_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                messages = []
                if system:
                    messages.append({"role": "system", "content": system})
                messages.append({"role": "user", "content": prompt})
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                    json={"model": model, "messages": messages,
                          "temperature": temperature, "max_tokens": max_tokens},
                )
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"]
        except Exception:
            pass

    if ANTHROPIC_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                messages = []
                if system:
                    messages.append({"role": "user", "content": system + "\n\n" + prompt})
                else:
                    messages.append({"role": "user", "content": prompt})
                resp = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={"x-api-key": ANTHROPIC_API_KEY,
                             "anthropic-version": "2023-06-01"},
                    json={"model": model, "max_tokens": max_tokens,
                          "temperature": temperature, "messages": messages},
                )
                if resp.status_code == 200:
                    return resp.json()["content"][0]["text"]
        except Exception:
            pass

    return "AI service not configured — please set OPENAI_API_KEY or ANTHROPIC_API_KEY."


async def draft_email_ai(lead_name: str, business_name: Optional[str] = None,
                         service: Optional[str] = None, tone: str = "professional",
                         key_points: Optional[str] = None) -> dict:
    """AI-drafted outreach email."""
    system = "You are an expert B2B copywriter. Write concise, persuasive outreach emails."
    prompt = f"""Write a {tone} outreach email to {lead_name}{f' at {business_name}' if business_name else ''}.
{f'Service: {service}' if service else ''}
{f'Key points to include: {key_points}' if key_points else ''}
Return JSON: {{"subject": "...", "body_text": "...", "body_html": "..."}}"""
    result = await llm_complete(prompt, system=system, temperature=0.7)
    try:
        return json.loads(result)
    except Exception:
        return {"subject": f"Hi {lead_name}", "body_text": result, "body_html": result}


async def summarize_call_ai(transcript: str, speaker_names: Optional[str] = None) -> dict:
    """AI call summarization."""
    system = "You are an expert at summarizing business calls. Extract summary, action items, sentiment, and topics."
    prompt = f"""Summarize this call transcript{f' (speakers: {speaker_names})' if speaker_names else ''}:
{transcript}
Return JSON: {{"summary": "...", "action_items": [...], "sentiment": "positive|neutral|negative", "key_topics": [...]}}"""
    result = await llm_complete(prompt, system=system, temperature=0.3)
    try:
        return json.loads(result)
    except Exception:
        return {"summary": result, "action_items": [], "sentiment": "neutral", "key_topics": []}


async def score_lead_ai(lead_name: str, business_name: Optional[str] = None,
                        industry: Optional[str] = None, website: Optional[str] = None,
                        notes: Optional[str] = None) -> dict:
    """AI lead scoring 0-100."""
    system = "You are an expert sales development representative. Score leads 0-100."
    prompt = f"""Score this lead:
Name: {lead_name}
Business: {business_name or 'N/A'}
Industry: {industry or 'N/A'}
Website: {website or 'N/A'}
Notes: {notes or 'N/A'}
Return JSON: {{"score": 0-100, "tier": "HOT|WARM|COLD", "reasoning": "...", "recommended_channel": "email|whatsapp|phone|postal", "recommended_message": "..."}}"""
    result = await llm_complete(prompt, system=system, temperature=0.3)
    try:
        return json.loads(result)
    except Exception:
        return {"score": 50, "tier": "WARM", "reasoning": result[:200],
                "recommended_channel": "email", "recommended_message": None}


async def generate_proposal_ai(client_name: str, project_name: str, services: str,
                               timeline_weeks: Optional[int] = None,
                               budget_usd: Optional[float] = None) -> dict:
    """AI-generated project proposal."""
    system = "You are an expert proposal writer for a digital agency."
    prompt = f"""Write a project proposal:
Client: {client_name}
Project: {project_name}
Services: {services}
Timeline: {timeline_weeks or 'TBD'} weeks
Budget: ${budget_usd:,.0f if budget_usd else 'TBD'}
Return JSON: {{"proposal_text": "...", "estimated_timeline": "...", "estimated_budget": "...", "key_deliverables": [...]}}"""
    result = await llm_complete(prompt, system=system, temperature=0.7)
    try:
        return json.loads(result)
    except Exception:
        return {"proposal_text": result, "estimated_timeline": f"{timeline_weeks or 'TBD'} weeks",
                "estimated_budget": f"${budget_usd:,.0f}" if budget_usd else "TBD",
                "key_deliverables": [s.strip() for s in services.split(",") if s.strip()]}


async def meeting_assistant_ai(transcript: str, meeting_type: str = "general") -> dict:
    """AI meeting assistant — extract action items, decisions, follow-ups."""
    system = "You are an expert meeting assistant. Extract action items, decisions, and follow-ups."
    prompt = f"""Analyze this {meeting_type} meeting transcript:
{transcript}
Return JSON: {{"summary": "...", "action_items": [...], "decisions": [...], "follow_ups": [...]}}"""
    result = await llm_complete(prompt, system=system, temperature=0.3)
    try:
        return json.loads(result)
    except Exception:
        return {"summary": result[:500], "action_items": [], "decisions": [], "follow_ups": []}


async def content_generator_ai(topic: str, content_type: str, tone: str = "professional",
                               target_audience: Optional[str] = None,
                               key_points: Optional[str] = None) -> dict:
    """AI content generator."""
    system = "You are an expert content marketer."
    prompt = f"""Write {content_type} content about: {topic}
Tone: {tone}
Target audience: {target_audience or 'General business owners'}
Key points: {key_points or 'N/A'}
Return JSON: {{"title": "...", "content": "...", "seo_keywords": [...], "meta_description": "..."}}"""
    result = await llm_complete(prompt, system=system, temperature=0.7)
    try:
        return json.loads(result)
    except Exception:
        return {"title": topic, "content": result,
                "seo_keywords": [topic.lower(), content_type],
                "meta_description": f"Professional {content_type} about {topic}."}


async def csr_response_ai(message: str, history: List[dict]) -> dict:
    """AI CSR — first response before human joins."""
    system = "You are PEGTech's AI Customer Service Representative. Be helpful, concise, and know when to escalate to a human."
    history_text = "\n".join(f"{h.get('role', 'user')}: {h.get('content', '')}" for h in history[-5:])
    prompt = f"""Conversation history:
{history_text}
Customer: {message}
Return JSON: {{"intent": "pricing_inquiry|booking_request|support_request|career_inquiry|general_inquiry", "response": "...", "escalate": true|false}}"""
    result = await llm_complete(prompt, system=system, temperature=0.5)
    try:
        return json.loads(result)
    except Exception:
        return {"intent": "general_inquiry", "response": result[:500], "escalate": False}
