"""
Provider-agnostic AI client with a priority-ordered fallback chain.

Why this exists: individual LLM vendors rate-limit, go down, or deprecate
model IDs on their own schedule (Gemini alone has rerouted three model
generations within the last year). A single feature calling one hardcoded
model on one vendor means a vendor-side blip becomes a PEGTech outage.
Instead, every call here walks a configurable chain of (provider, model)
tiers — highest quality first — and only moves to the next tier on a real
failure (timeout, HTTP error, empty/unparseable response). The chain and
every model ID live in `config.AI_FALLBACK_CHAIN`, not in code, so it can
be re-ordered or repointed at new model names without a deploy.

Callers should treat `ai_complete()` returning None as "no AI provider is
currently reachable" and fall back to a rule-based result rather than
raising — see services.py for that pattern.
"""
from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from typing import Optional

import httpx

from app.config import (
    AI_FALLBACK_CHAIN,
    ANTHROPIC_API_KEY,
    GEMINI_API_KEY,
    OPENAI_API_KEY,
)

logger = logging.getLogger("pegtech.ai")

_PROVIDER_KEYS = {
    "gemini": GEMINI_API_KEY,
    "openai": OPENAI_API_KEY,
    "anthropic": ANTHROPIC_API_KEY,
}

_TIMEOUT_SECONDS = 25.0


@dataclass
class AIResult:
    text: str
    provider: str
    model: str
    latency_ms: int


def _parse_chain() -> list[tuple[str, str]]:
    """Parses 'provider:model,provider:model,...' into pairs, skipping any
    tier whose provider has no API key configured — that tier is simply
    not available right now, not an error."""
    pairs: list[tuple[str, str]] = []
    for item in AI_FALLBACK_CHAIN.split(","):
        item = item.strip()
        if not item or ":" not in item:
            continue
        provider, _, model = item.partition(":")
        provider = provider.strip().lower()
        model = model.strip()
        if not model:
            continue
        if not _PROVIDER_KEYS.get(provider):
            continue  # no key for this provider — skip, don't fail
        pairs.append((provider, model))
    return pairs


def _call_gemini(model: str, prompt: str, system: Optional[str], json_mode: bool,
                  temperature: float, max_tokens: int) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    generation_config: dict = {"temperature": temperature, "maxOutputTokens": max_tokens}
    if json_mode:
        generation_config["responseMimeType"] = "application/json"
    body: dict = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": generation_config,
    }
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}
    resp = httpx.post(
        url,
        headers={"x-goog-api-key": GEMINI_API_KEY, "Content-Type": "application/json"},
        json=body,
        timeout=_TIMEOUT_SECONDS,
    )
    resp.raise_for_status()
    data = resp.json()
    candidates = data.get("candidates") or []
    if not candidates:
        block_reason = (data.get("promptFeedback") or {}).get("blockReason")
        raise ValueError(f"Gemini returned no candidates (blockReason={block_reason})")
    parts = (candidates[0].get("content") or {}).get("parts") or []
    text = "".join(p.get("text", "") for p in parts).strip()
    if not text:
        raise ValueError("Gemini returned an empty response")
    return text


def _call_openai(model: str, prompt: str, system: Optional[str], json_mode: bool,
                  temperature: float, max_tokens: int) -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    body: dict = {"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens}
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    resp = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
        json=body,
        timeout=_TIMEOUT_SECONDS,
    )
    resp.raise_for_status()
    text = resp.json()["choices"][0]["message"]["content"].strip()
    if not text:
        raise ValueError("OpenAI returned an empty response")
    return text


def _call_anthropic(model: str, prompt: str, system: Optional[str], json_mode: bool,
                     temperature: float, max_tokens: int) -> str:
    user_content = prompt
    if json_mode:
        user_content += "\n\nRespond with ONLY valid JSON, no markdown fences, no commentary."
    body: dict = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": [{"role": "user", "content": user_content}],
    }
    if system:
        body["system"] = system
    resp = httpx.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        },
        json=body,
        timeout=_TIMEOUT_SECONDS,
    )
    resp.raise_for_status()
    blocks = resp.json().get("content") or []
    text = "".join(b.get("text", "") for b in blocks if b.get("type") == "text").strip()
    if not text:
        raise ValueError("Anthropic returned an empty response")
    return text


_CALLERS = {"gemini": _call_gemini, "openai": _call_openai, "anthropic": _call_anthropic}


def ai_complete(prompt: str, system: Optional[str] = None, json_mode: bool = False,
                 temperature: float = 0.7, max_tokens: int = 1000) -> Optional[AIResult]:
    """Tries each (provider, model) tier in AI_FALLBACK_CHAIN in order,
    returning the first successful result. Returns None if every
    configured tier failed (or none are configured at all) — callers
    should fall back to a rule-based result in that case, never raise a
    user-facing error over an AI vendor hiccup."""
    chain = _parse_chain()
    if not chain:
        logger.warning("ai_complete: no AI provider configured (no API key set for any chain tier)")
        return None

    last_error: Optional[Exception] = None
    for provider, model in chain:
        caller = _CALLERS[provider]
        started = time.monotonic()
        try:
            text = caller(model, prompt, system, json_mode, temperature, max_tokens)
            latency_ms = int((time.monotonic() - started) * 1000)
            logger.info("ai_complete: %s/%s answered in %dms", provider, model, latency_ms)
            return AIResult(text=text, provider=provider, model=model, latency_ms=latency_ms)
        except Exception as e:  # noqa: BLE001 — any failure just advances the chain
            latency_ms = int((time.monotonic() - started) * 1000)
            logger.warning("ai_complete: %s/%s failed after %dms (%s) — trying next tier",
                            provider, model, latency_ms, e)
            last_error = e
            continue

    logger.error("ai_complete: every chain tier failed, last error: %s", last_error)
    return None


def ai_complete_json(prompt: str, system: Optional[str] = None,
                      temperature: float = 0.5, max_tokens: int = 1000) -> Optional[dict]:
    """Like ai_complete, but parses the result as JSON, stripping a
    markdown code fence if the model wrapped it in one despite being
    asked not to. Returns None on total chain failure OR unparseable JSON
    from every tier — same contract as ai_complete, callers fall back."""
    result = ai_complete(prompt, system=system, json_mode=True, temperature=temperature, max_tokens=max_tokens)
    if result is None:
        return None
    text = result.text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.strip()
    try:
        parsed = json.loads(text)
        parsed["_ai_provider"] = result.provider
        parsed["_ai_model"] = result.model
        return parsed
    except (json.JSONDecodeError, TypeError) as e:
        logger.warning("ai_complete_json: %s/%s returned unparseable JSON: %s", result.provider, result.model, e)
        return None


def ai_status() -> dict:
    """Which providers are currently configured, for a simple health
    check (e.g. an admin-only diagnostics endpoint) without making a
    network call."""
    chain = _parse_chain()
    return {
        "configured_providers": sorted({p for p, _ in chain}),
        "chain": [f"{p}:{m}" for p, m in chain],
        "ready": bool(chain),
    }
