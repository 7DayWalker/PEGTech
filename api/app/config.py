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

# AI (OpenAI / Anthropic / etc.)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
AI_DEFAULT_MODEL = os.getenv("AI_DEFAULT_MODEL", "gpt-4o-mini")

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
