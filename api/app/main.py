"""
PEGTech — FastAPI backend for client-services agency platform.
"""
import os
from urllib.parse import urlparse
from fastapi import FastAPI, HTTPException
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


print("boot: checking demo seed ...", flush=True)
_seed_if_empty()
print("boot: startup sequence complete", flush=True)

# Import routers individually with try/except so a stale cached router
# (e.g. schemas.py missing EnquiryIn) cannot crash the whole app.
import importlib
_routers = []
for _mod_name in ("public", "admin", "clients", "projects", "leads",
                  "campaigns", "bookings", "audit", "careers", "chat", "enquiries"):
    try:
        _mod = importlib.import_module(f"app.routers.{_mod_name}")
        _routers.append(_mod.router)
        print(f"router loaded: {_mod_name}", flush=True)
    except Exception as _e:
        print(f"router SKIPPED ({_mod_name}): {_e}", flush=True)

from app.security_routes import router as auth_router

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


for r in (*_routers, auth_router):
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
