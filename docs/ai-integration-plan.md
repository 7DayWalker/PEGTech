# AI Integration Plan — PEGTech

Status: **planning**. Nothing in this doc is built yet except where noted.

## 0. Current state (audited from the codebase, 2026-10-26)

- `api/app/services.py` — the functions actually wired into routers today
  (`score_lead`, `draft_email`, `summarize_call`, `csr_response`, etc.) are
  **rule-based stubs**, each explicitly commented `"LLM can enhance this"`.
  The public CSR chat widget, for example, is keyword matching
  (`if "price" in message: ...`) — not a model call.
- `api/app/services/ai.py` — a **second, unused** module with real
  OpenAI/Anthropic HTTP calls already written (`score_lead_ai`,
  `draft_email_ai`, `summarize_call_ai`, `generate_proposal_ai`,
  `content_generator_ai`, `meeting_assistant_ai`, `csr_response_ai`).
  Nothing in any router calls any of these. Dead code.
- `config.py` reads `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` /
  `AI_DEFAULT_MODEL`, but **neither key is set in Railway production** —
  confirmed directly against the live environment.
- `models.Lead.ai_score`, `models.Application.ai_score` /
  `ai_summary` — DB columns that exist and are never populated.
- Public marketing copy promises "AI agents, automation, and machine
  learning" the product doesn't yet deliver on.

## 1. Foundation: provider-agnostic AI client with fallback chain

Before any feature work, replace `services/ai.py` with a single client that:

- Supports **Gemini, OpenAI, and Anthropic** behind one interface —
  `ai_complete(prompt, system=None, json_mode=False, temperature=…)`.
- Tries providers/models in a **configurable priority order**, falling
  through to the next on error, timeout, rate-limit (HTTP 429), or an
  empty/invalid response. Example default chain (all tiers of a single
  provider count as separate fallback steps):

  1. Gemini — flagship tier (best quality, highest cost)
  2. Gemini — mid tier (fast, cheap, good default for most calls)
  3. Gemini — lite tier (cheapest/fastest, last resort before other providers)
  4. OpenAI — budget model *(only if `OPENAI_API_KEY` is ever added)*
  5. Anthropic — budget model *(only if `ANTHROPIC_API_KEY` is ever added)*
  6. Final fallback: the existing **rule-based stub** from `services.py` —
     so a total outage never breaks the product, it just quietly gets
     dumber for a few minutes.

- Exact model IDs live in **env vars, not code** (`AI_FALLBACK_CHAIN=
  gemini:gemini-2.5-pro,gemini:gemini-2.5-flash,gemini:gemini-2.5-flash-lite`)
  since Google/OpenAI/Anthropic rename and deprecate model IDs every few
  months — confirmed Gemini alone has 2.5 → 3.x routing changes scheduled
  within weeks of today. Changing the chain should never require a deploy.
- Every call logs which provider/model actually answered + latency, so we
  can see fallback-chain health over time (cheap table, or just structured
  logs to start).
- Per-feature cost controls: `max_tokens` caps, and a per-session/per-IP
  rate limit specifically on the **public, unauthenticated** CSR endpoint
  (the one surface a bad actor could hit to run up your bill).

**What I need from you to start this:** your Gemini API key (from Google
AI Studio), added as `GEMINI_API_KEY` in Railway. OpenAI/Anthropic keys
are optional and can be added later — the chain just skips tiers whose
key isn't set.

## 2. Phase 1 — Staff Dashboard (AdminPortal)

In rough build order (each is independently shippable):

1. **Daily Briefing card** — "what needs attention today": hot leads
   uncontacted >48h, leads flagged during import as *possibly out of
   business* or *already has a website*, unread messages, pending
   escalations. Ships **rule-based first** (zero AI cost, uses data we
   already have from the lead-import work), then gets a one-line AI
   summary layered on top as a cheap, cached, once-per-session call.
2. **Real AI lead scoring** — wires `score_lead_ai` through the new
   client, finally populates the dormant `ai_score` field using the
   research notes/rating/email-confidence the import feature now
   captures. Triggered on import and via a manual "Re-score" button;
   surfaces as a sortable priority badge on the Leads list, with a "Top
   priority leads" widget on the Dashboard.
3. **AI-drafted outreach** — one-click real email/WhatsApp drafts per
   lead, pulling in that lead's research notes, replacing the generic
   template stub.
4. **Escalation summaries** — AI summary of flagged conversations shown
   in the Dashboard's escalations alert instead of a raw count.
5. **"Ask your dashboard"** natural-language query box — stretch goal,
   lower priority (needs care around hallucination/data-safety since
   it's answering from real business data).

## 3. Phase 2 — Public AI CSR widget

- Swap the keyword-matching `csr_response()` for real `csr_response_ai()`
  through the fallback chain.
- Guardrailed system prompt: no price commitments, no contract/legal
  promises, clear instructions on when to escalate to a human.
- Keep existing `AiInteraction` logging; keep the rule-based version as
  the final fallback tier so the widget never goes fully silent.
- Needs the rate-limiting from §1 before going live, since this is the
  one AI surface strangers can hit directly.

## 4. Order of operations

Foundation (§1) blocks everything else — nothing in §2/§3 can be tested
for real without it. Recommended sequence once you provide the key:

1. Build + ship the provider-agnostic client (§1), smoke test against
   real Gemini calls.
2. Daily Briefing, rule-based half first (§2.1) — immediate visible value,
   zero AI cost, validates the "what needs attention" logic staff actually
   want before spending tokens on it.
3. Real lead scoring (§2.2) — directly extends the bulk-import feature
   just shipped.
4. AI-drafted outreach (§2.3).
5. Escalation summaries (§2.4) + public CSR fix (§3) together, since both
   reuse the same summarization/guardrail patterns.
6. "Ask your dashboard" (§2.5) last, if still wanted.
