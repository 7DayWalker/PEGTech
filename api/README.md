# PEGTech — Backend API

FastAPI backend for the PEGTech client-services agency platform.

## Structure

```
api/
  app/
    main.py          — FastAPI entrypoint, CORS, health, SPA serving
    config.py        — Pydantic settings from env
    db.py            — SQLAlchemy engine + session, Railway PostgreSQL + SQLite fallback
    models.py        — SQLAlchemy 2.x ORM models
    schemas.py       — Pydantic v2 request/response schemas
    security.py      — bcrypt password hashing, JWT create/verify
    security_routes.py — /api/auth/login, /whoami, /logout
    deps.py          — JWT auth dependencies (staff/client roles)
    ratelimit.py     — Token bucket rate limiting
    services.py      — Pure domain logic (audit, booking, AI helpers)
    services/ai.py   — LLM-powered AI features
    routers/         — admin, clients, projects, leads, campaigns, bookings, audit, careers, chat, enquiries, public
    seed.py          — Demo data seeding
  requirements.txt
  Dockerfile
  railway.toml
```

## AI Features

- **AI CSR** — First-response agent before human joins
- **AI Email Drafting** — Personalized outreach emails
- **AI Call Summarization** — Transcript summarization with action items
- **AI Lead Scoring** — 0-100 lead scoring with tier recommendations
- **AI Proposal Generation** — Client project proposals
- **AI Meeting Assistant** — Action items, decisions, follow-ups
- **AI Content Generator** — Blog, social, email, landing page content
- **AI Revenue-Leak Audit** — Prospect ROI calculator

## Deployment

Deploy to Railway with PostgreSQL plugin. Set environment variables from `.env.example`.
