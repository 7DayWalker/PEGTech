"""
Lead Gen SaaS — FastAPI backend.
Multi-niche lead generation and outreach platform.
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, get_db, init_db
from app.models import User
from app.schemas import UserOut
from app.routes import auth, leads, campaigns, sends, previews, niches, health
from app.utils.security import get_password_hash

# ---------------------------------------------------------------------------
# Lifespan: initialize DB on startup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Seed a default niche if none exist
    from sqlalchemy.orm import Session
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            pass  # no users yet, niches will be created on signup
    finally:
        db.close()
    print(f"🚀 {settings.app_name} v{settings.app_version} starting on {settings.host}:{settings.port}")
    yield


# Need SessionLocal for the seed block above
from app.database import SessionLocal  # noqa: E402

# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Health (no auth)
# ---------------------------------------------------------------------------
app.include_router(health.router, prefix="", tags=["health"])

# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(niches.router, prefix="/api/v1/niches", tags=["niches"])
app.include_router(leads.router, prefix="/api/v1/leads", tags=["leads"])
app.include_router(campaigns.router, prefix="/api/v1/campaigns", tags=["campaigns"])
app.include_router(sends.router, prefix="/api/v1/sends", tags=["sends"])
app.include_router(previews.router, prefix="/api/v1/previews", tags=["previews"])

# ---------------------------------------------------------------------------
# Frontend SPA
# ---------------------------------------------------------------------------
frontend_dir = Path(__file__).resolve().parent.parent / "frontend"
app.mount(
    "/assets",
    StaticFiles(directory=str(frontend_dir / "assets")),
    name="assets",
)


@app.get("/", include_in_schema=False)
async def serve_frontend():
    return FileResponse(str(frontend_dir / "index.html"))


@app.get("/{path:path}", include_in_schema=False)
async def serve_spa(path: str):
    file_path = frontend_dir / path
    if file_path.exists() and file_path.is_file():
        return FileResponse(str(file_path))
    return FileResponse(str(frontend_dir / "index.html"))


# ---------------------------------------------------------------------------
# Root health
# ---------------------------------------------------------------------------
@app.get("/healthz")
async def root_health():
    return {"status": "ok", "service": settings.app_name}