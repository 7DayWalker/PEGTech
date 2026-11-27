"""
PEGTech — FastAPI backend for client-services agency platform.
"""
import os
from urllib.parse import urlparse
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

class ImmutableStaticFiles(StaticFiles):
    """Content-hashed assets: safe to cache forever."""
    async def get_response(self, path, scope):
        resp = await super().get_response(path, scope)
        if resp.status_code == 200:
            resp.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return resp

print("boot: importing app ...", flush=True)
from app.config import ALLOWED_ORIGINS, APP_BUILD
from app.db import init_db

print("boot: connecting to database ...", flush=True)
init_db()
print("boot: database ready", flush=True)


def _seed_if_empty():
    """Demo bootstrap for fresh deployments."""
    if os.environ.get("PEGTECH_SEED_ON_EMPTY", "") != "1":
        return
    from app.db import SessionLocal
    from app import models
    with SessionLocal() as db:
        empty = db.query(models.AdminUser).count() == 0
    if empty:
        from app import seed as _seed
        try:
            _seed.run(reset=False)
            print("PEGTECH_SEED_ON_EMPTY=1 and database is empty — seeded demo data.")
        except Exception as e:
            print(f"seed-on-empty failed (continuing anyway): {e}")


def _reset_admin_if_requested():
    """Explicit opt-in override: sync PEGTECH_ADMIN_EMAIL/PASSWORD onto the
    admin_users table even when it's already populated (e.g. a prior deploy
    seeded the default demo credentials, and setting PEGTECH_ADMIN_PASSWORD
    alone won't touch that existing row — the seed-on-empty path only ever
    runs once, against an empty table)."""
    if os.environ.get("PEGTECH_RESET_ADMIN_PASSWORD", "") != "1":
        return
    from app.db import SessionLocal
    from app import models
    from app.security import hash_password
    from app.config import ADMIN_EMAIL, ADMIN_PASSWORD
    email = ADMIN_EMAIL.strip().lower()
    with SessionLocal() as db:
        try:
            user = db.query(models.AdminUser).filter_by(email=email).first()
            if user:
                user.password_hash = hash_password(ADMIN_PASSWORD)
                user.is_active = True
                db.commit()
                print(f"PEGTECH_RESET_ADMIN_PASSWORD=1 — reset password for existing admin {email}")
            else:
                user = models.AdminUser(
                    email=email,
                    password_hash=hash_password(ADMIN_PASSWORD),
                    name="Admin",
                    role="owner",
                    is_active=True,
                )
                db.add(user)
                db.commit()
                print(f"PEGTECH_RESET_ADMIN_PASSWORD=1 — created missing admin {email}")
        except Exception as e:
            print(f"admin-reset failed (continuing anyway): {e}")


print("boot: checking demo seed ...", flush=True)
_seed_if_empty()
_reset_admin_if_requested()
print("boot: startup sequence complete", flush=True)

# Import routers individually with try/except so a stale cached router
# (e.g. schemas.py missing EnquiryIn) cannot crash the whole app.
import importlib
_routers = []
for _mod_name in ("public", "admin", "clients", "projects", "leads",
                  "campaigns", "bookings", "audit", "careers", "chat", "enquiries",
                  "messaging", "webhooks", "media"):
    try:
        _mod = importlib.import_module(f"app.routers.{_mod_name}")
        _routers.append(_mod.router)
        print(f"router loaded: {_mod_name}", flush=True)
    except Exception as _e:
        print(f"router SKIPPED ({_mod_name}): {_e}", flush=True)

# Auth router is also imported defensively so a failure there
# cannot take down the whole service.
try:
    from app.security_routes import router as auth_router
    print("router loaded: auth", flush=True)
except Exception as _e:
    print(f"router SKIPPED (auth): {_e}", flush=True)
    auth_router = None

app = FastAPI(title="PEGTech — Platform API", version="2.0.0",
              docs_url="/api/docs", openapi_url="/api/openapi.json")

if ALLOWED_ORIGINS:
    app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS,
                       allow_methods=["*"], allow_headers=["*"])


@app.middleware("http")
async def origin_guard(request, call_next):
    """CSRF guard: mutating requests require matching Origin header."""
    if request.method not in ("GET", "HEAD", "OPTIONS"):
        origin = request.headers.get("origin")
        if origin and origin != "null":
            try:
                origin_host = urlparse(origin).netloc.lower()
            except Exception:
                origin_host = ""
            host = (request.headers.get("host") or "").lower()
            allowed = origin_host and (origin_host == host or origin.rstrip("/") in ALLOWED_ORIGINS)
            if not allowed:
                return JSONResponse({"detail": "Cross-site request rejected."}, status_code=403)
    return await call_next(request)


@app.get("/api/public/version")
def version():
    return {"v": APP_BUILD}


@app.get("/api/health")
def health():
    return {"ok": True, "service": "pegtech-api"}



_all_routers = [*_routers]
if auth_router is not None:
    _all_routers.append(auth_router)
for r in _all_routers:
    app.include_router(r)


# ── Serve the built SPA (Vite) with client-side routing fallback ──
SITE_DIST = os.environ.get("SITE_DIST") or os.path.join(os.path.dirname(__file__), "..", "..", "site", "dist")
INDEX = os.path.join(SITE_DIST, "index.html")

if os.path.isfile(INDEX):
    assets_dir = os.path.join(SITE_DIST, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", ImmutableStaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found.")
        candidate = os.path.normpath(os.path.join(SITE_DIST, full_path))
        headers = {"Cache-Control": "no-cache, must-revalidate"}
        if full_path and candidate.startswith(os.path.normpath(SITE_DIST)) and os.path.isfile(candidate):
            return FileResponse(candidate, headers=headers)
        return FileResponse(INDEX, headers=headers)
