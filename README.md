# Lead Gen SaaS

Multi-niche lead generation and outreach platform.
Built with **FastAPI**, **SQLAlchemy**, **Railway PostgreSQL**, and **JWT auth**.

## What it does

- **Multi-niche lead management** — import, view, filter, and track leads for any industry (roofing, plumbing, HVAC, electrical, landscaping, etc.)
- **Niche organization** — group leads and campaigns by industry vertical
- **Preview site generator** — creates self-contained, single-file preview websites for each lead (no external dependencies, works offline)
- **Email outreach** — send personalized campaigns via SMTP with CAN-SPAM compliance (unsubscribe headers, postal address)
- **WhatsApp Business** — send messages via Meta Graph API
- **Campaign dashboard** — track sends, replies, opt-outs, and stats
- **Authentication** — self-managed JWT auth (no Supabase required)

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  Frontend   │────→│  FastAPI     │────→│  Railway PG     │
│  (HTML/JS)  │      │  (Python)    │      │  (PostgreSQL)   │
└─────────────┘      └──────────────┘      └─────────────────┘
                                                    │
                      ┌───────────────┐             │
                      │   SMTP        │◀────────────┘
                      │ (Gmail/etc)   │
                      └───────────────┘
                      ┌───────────────┐
                      │ WhatsApp API  │◀────────────┐
                      │ (Meta Graph)  │             │
                      └───────────────┘             │
                                                    │
                      ┌───────────────┐             │
                      │ Google Drive  │◀────────────┘
                      │ (optional)    │
                      └───────────────┘
```

## Why no Supabase?

You don't need Supabase for this stack. Everything runs on **Railway**:

| Component | Technology | Why |
|---|---|---|
| Database | Railway PostgreSQL | Built-in add-on, no separate account |
| Auth | JWT (self-managed) | No Auth service needed |
| Storage | Google Drive (optional) | Already connected in Arena |
| Email | SMTP | Gmail/SendGrid/Mailgun |
| WhatsApp | Meta Graph API | Direct API integration |

If you already have a Supabase project and want to use it, you can swap the database layer — the app uses SQLAlchemy, so the change is localized to `app/database.py`.

## Quick Start

### 1. Clone and enter

```bash
cd /home/user/lead-gen-saas
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your settings. At minimum:
- `SECRET_KEY` — change to a random secret
- `DATABASE_URL` — Railway PostgreSQL connection string (or leave as SQLite for local dev)
- `SENDER_EMAIL`, `SMTP_USER`, `SMTP_PASSWORD` — for email outreach
- `UNSUBSCRIBE_BASE_URL`, `PREVIEW_BASE_URL` — your Railway domain

### 3. Run locally

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Open `http://localhost:8000` in your browser.

### 4. Deploy on Railway

1. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/lead-gen-saas.git
   git push -u origin main
   ```

2. Create a new service on [Railway](https://railway.app)
3. Connect your GitHub repo
4. Add the **PostgreSQL** plugin on Railway (gives you `DATABASE_URL`)
5. Add all environment variables from `.env` in the Railway dashboard
6. Railway detects the `Dockerfile` and builds automatically
7. Your app is live at `https://your-app.railway.app`

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | Yes | App secret key (change in production) |
| `DATABASE_URL` | Yes | Railway PostgreSQL connection string |
| `SENDER_EMAIL` | Yes | Outbound email address |
| `SENDER_NAME` | Yes | Sender display name |
| `SMTP_HOST` | Yes | SMTP server host |
| `SMTP_USER` | Yes | SMTP username |
| `SMTP_PASSWORD` | Yes | SMTP password |
| `WHATSAPP_ACCESS_TOKEN` | No | Meta WhatsApp Business access token |
| `WHATSAPP_PHONE_NUMBER_ID` | No | WhatsApp phone number ID |
| `UNSUBSCRIBE_BASE_URL` | Yes | Your app's public URL |
| `PREVIEW_BASE_URL` | Yes | Your app's public URL |
| `GOOGLE_DRIVE_FOLDER_ID` | No | Optional Drive folder for backups |

## API Endpoints

### Auth
- `POST /api/v1/auth/register` — Register
- `POST /api/v1/auth/login` — Login (returns JWT)
- `GET /api/v1/auth/me` — Current user

### Niches (industry verticals)
- `GET/POST /api/v1/niches` — List/create niches
- `GET/PATCH/DELETE /api/v1/niches/{id}` — Niche CRUD

### Leads
- `GET/POST /api/v1/leads` — Lead CRUD
- `GET/PATCH/DELETE /api/v1/leads/{id}`
- `POST /api/v1/leads/import-preview` — CSV import preview

### Campaigns
- `GET/POST /api/v1/campaigns` — Campaign CRUD
- `POST /api/v1/campaigns/{id}/send` — Send campaign
- `GET/PATCH/DELETE /api/v1/campaigns/{id}`

### Sends
- `GET /api/v1/sends` — Send logs
- `GET /api/v1/sends/stats` — Statistics

### Previews
- `GET/POST /api/v1/previews` — Preview site CRUD
- `GET /api/v1/previews/public/{slug}` — Public preview (no auth)

## Compliance

- All emails include `List-Unsubscribe` headers
- Each lead has a unique unsubscribe token
- Opt-out is respected across email and WhatsApp
- CAN-SPAM compliant (postal address required)
- Preview sites marked `noindex,nofollow`

## Multi-Niche

Add any industry via the Niches endpoint:
- Roofing, Plumbing, HVAC, Electrical, Landscaping
- Or any custom niche — the preview generator adapts automatically

## Files

```
/home/user/lead-gen-saas/
├── Dockerfile              # Railway container build
├── railway.toml            # Railway deployment config
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
├── README.md               # This file
├── app/
│   ├── main.py             # FastAPI entrypoint
│   ├── config.py           # Configuration
│   ├── database.py         # SQLAlchemy engine + session
│   ├── models.py           # SQLAlchemy ORM models
│   ├── schemas.py          # Pydantic schemas
│   ├── utils/security.py   # JWT + password hashing
│   ├── routes/             # API route handlers
│   └── services/           # Email, WhatsApp, preview, Drive services
├── frontend/
│   ├── index.html          # Dashboard UI
│   └── assets/
│       ├── style.css       # Styles
│       └── app.js          # Frontend logic
└── scripts/
    └── seed.py             # Optional seed script
```

---

Built for autonomous lead generation — start with roofers, expand to any niche. 🚀