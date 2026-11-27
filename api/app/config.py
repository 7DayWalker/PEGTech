"""
PEGTech configuration — all settings from environment variables.
"""
import os
import time

# Per-process build tag: bumps on every restart
APP_BUILD = os.getenv("PEGTECH_BUILD", str(int(time.time())))

# Database (Railway PostgreSQL or local SQLite fallback)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pegtech.db")

# JWT
JWT_SECRET = os.getenv("PEGTECH_JWT_SECRET", "dev-only-secret-change-in-production")
JWT_ALG = "HS256"
JWT_TTL_MINUTES = int(os.getenv("PEGTECH_JWT_TTL_MINUTES", "720"))

# Admin / staff defaults
ADMIN_EMAIL = os.getenv("PEGTECH_ADMIN_EMAIL", "admin@pegtech.co")
ADMIN_PASSWORD = os.getenv("PEGTECH_ADMIN_PASSWORD", "demo-admin-please-change")

# Email (Resend or SMTP)
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")  # empty = email disabled, logged only
PEGTECH_EMAIL_FROM = os.getenv("PEGTECH_EMAIL_FROM", "PEGTech <noreply@pegtech.co>")

# WhatsApp (Meta Graph API)
WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
# Inbound webhook: WHATSAPP_VERIFY_TOKEN must match the "Verify token" you
# set in Meta App Dashboard -> WhatsApp -> Configuration -> Webhook.
# WHATSAPP_APP_SECRET is the app's "App Secret" (Basic Settings) used to
# verify the X-Hub-Signature-256 header on every inbound webhook POST, so
# nobody but Meta can inject fake messages. Signature check is skipped
# (logged as a warning) if left empty, so the webhook still works while
# you're first wiring it up.
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "")
WHATSAPP_APP_SECRET = os.getenv("WHATSAPP_APP_SECRET", "")

# AI — provider-agnostic, with a priority-ordered fallback chain so one
# vendor's outage/rate-limit/deprecation never takes down an AI feature.
# Each key is independently optional; the chain below only uses the tiers
# whose provider has a key configured, in the order given, finally
# dropping to a rule-based stub (handled in ai_client.py, not here) if
# every provider in the chain fails.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Comma-separated "provider:model" pairs, tried in order. Kept in an env
# var rather than hardcoded because model IDs get renamed/deprecated by
# vendors every few months — changing the chain should never need a
# deploy. Default favors Gemini (flagship -> mid -> lite) since that's
# the provider actually configured for this project; OpenAI/Anthropic
# tiers are harmless no-ops here until their keys are set, since
# ai_client.py skips any tier whose provider has no key.
AI_FALLBACK_CHAIN = os.getenv(
    "AI_FALLBACK_CHAIN",
    "gemini:gemini-pro-latest,gemini:gemini-flash-latest,gemini:gemini-flash-lite-latest,"
    "openai:gpt-4o-mini,anthropic:claude-3-5-haiku-20241022",
)
# Note on the Gemini tiers above: "-latest" aliases (rather than pinned
# versions like gemini-2.5-pro) are Google's own recommended way to avoid
# hardcoding a model ID that gets deprecated out from under you — Google
# points the alias at a new model generation on their own schedule. Also
# confirmed live: a free-tier Gemini key can have literally zero quota on
# the Pro tier (HTTP 429) while Flash tiers work fine, and any tier can
# return a transient HTTP 503 under high demand — exactly the two failure
# modes this fallback chain exists to route around without the whole
# feature going down.

# Captcha (Cloudflare Turnstile)
TURNSTILE_SECRET = os.getenv("TURNSTILE_SECRET", "")

# CORS
ALLOWED_ORIGINS = [o for o in os.getenv("PEGTECH_ALLOWED_ORIGINS", "").split(",") if o]

# Business config
BUSINESS_DAYS = [0, 1, 2, 3, 4]  # Mon–Fri
SLOTS = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30"]

# Compliance
POSTAL_ADDRESS = os.getenv("POSTAL_ADDRESS", "")
UNSUBSCRIBE_BASE_URL = os.getenv("UNSUBSCRIBE_BASE_URL", "")
