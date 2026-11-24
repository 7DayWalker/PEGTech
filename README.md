# PEGTech — Client Services Agency Platform

A full-stack web app for delivering web applications, AI solutions, and tech services to clients. Built with FastAPI + SQLAlchemy 2.x + PostgreSQL (backend) and React + TypeScript + Vite (frontend).

## Architecture

```
pegtech/
  api/
    app/
      main.py          — FastAPI entrypoint, CORS, health, SPA serving
      config.py        — Env-based settings
      db.py            — SQLAlchemy engine + session (PostgreSQL + SQLite fallback)
      models.py        — SQLAlchemy 2.x ORM models
      schemas.py       — Pydantic v2 request/response schemas
      security.py      — PBKDF2 password hashing, JWT create/verify
      security_routes.py — /api/auth/login, /whoami, /logout (HttpOnly cookies)
      deps.py          — JWT auth deps (staff/client roles)
      ratelimit.py     — Token bucket rate limiting
      services.py      — Pure domain logic (audit, booking, AI helpers)
      services/ai.py   — LLM-powered AI features
      routers/         — admin, clients, projects, leads, campaigns, bookings, audit, careers, chat, enquiries, public
      seed.py          — Demo data seeding
  site/
    src/
      pages/           — Home, Services, Book, Audit, Careers, SignIn, ClientPortal, AdminPortal
      components/      — Nav, Footer, Modal, ThemeToggle, ChatWidget
      lib/             — api, content, ai, Toast, hooks
  Dockerfile
  railway.toml
```

## AI Features

- **AI CSR** — First-response agent before human joins (`/api/chat/csr`)
- **AI Email Drafting** — Personalized outreach emails (`/api/ai/email/draft`)
- **AI Call Summarization** — Transcript → summary + action items + sentiment (`/api/ai/call/summarize`)
- **AI Lead Scoring** — 0-100 scoring with tier and channel recommendation (`/api/ai/lead/score`)
- **AI Proposal Generation** — Client project proposals (`/api/ai/proposal`)
- **AI Meeting Assistant** — Action items, decisions, follow-ups (`/api/ai/meeting`)
- **AI Content Generator** — Blog, social, email, landing page content (`/api/ai/content`)
- **AI Revenue-Leak Audit** — Prospect ROI calculator (`/api/public/audit`)

## Auth

- JWT in HttpOnly session cookie (`pegtech_session`)
- Staff + Client roles with route-level guards
- Origin-guard CSRF protection on mutating requests
- Rate limiting on POST endpoints

## Deployment

Deploy to Railway with PostgreSQL plugin. Set environment variables from `.env.example`.

```bash
# Local development
cd api && pip install -r requirements.txt
cd ../site && npm install && npm run dev
# Backend: uvicorn api.app.main:app --reload
# Frontend: http://localhost:5173
```
