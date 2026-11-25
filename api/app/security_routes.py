"""
Auth routes: login, whoami, logout — JWT in HttpOnly session cookie.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app.schemas import LoginIn, Token
from app.security import verify_password, issue_token
from app.deps import _payload
from app.config import JWT_TTL_MINUTES

router = APIRouter(prefix="/api/auth", tags=["auth"])
SESSION_COOKIE = "pegtech_session"


def _session_response(request: Request, payload: dict, token: str) -> JSONResponse:
    # Prefer an explicit forwarded-proto signal, but it doesn't reliably
    # survive every hop in a multi-proxy setup (platform edge → sandbox →
    # dev proxy → backend). Fall back to treating any non-localhost Host as
    # HTTPS — true for both the sandboxed preview domain and real
    # deployments (Railway), and this is what lets the session cookie
    # survive when the app is embedded in an iframe under a different
    # parent domain (which browsers treat as a cross-site context,
    # requiring SameSite=None; Secure).
    forwarded = (request.headers.get("x-forwarded-proto") or "").split(",")[0].strip().lower()
    host = (request.headers.get("host") or "").split(":")[0].lower()
    is_local = host in ("", "localhost", "127.0.0.1", "0.0.0.0")
    https = request.url.scheme == "https" or forwarded == "https" or not is_local
    resp = JSONResponse(payload)
    resp.set_cookie(
        SESSION_COOKIE, token,
        max_age=JWT_TTL_MINUTES * 60,
        httponly=True,
        samesite=("none" if https else "lax"),
        path="/",
        secure=https,
    )
    return resp


@router.post("/login", response_model=Token)
def login(payload: LoginIn, request: Request, db: Session = Depends(get_db)):
    email = payload.email.lower()
    staff = db.query(models.AdminUser).filter_by(email=email).first()
    if staff and verify_password(payload.password, staff.password_hash):
        token = issue_token(staff.email, typ="staff", role=staff.role, name=staff.name or staff.email)
        return _session_response(request, {
            "access_token": token, "token_type": "bearer",
            "typ": "staff", "role": staff.role, "name": staff.name or staff.email,
        }, token)
    client_user = db.query(models.ClientUser).filter_by(email=email).first()
    if client_user and verify_password(payload.password, client_user.password_hash):
        client = db.get(models.Client, client_user.client_id)
        token = issue_token(client_user.email, typ="client", role="client",
                            client_id=client_user.client_id, name=client_user.name)
        return _session_response(request, {
            "access_token": token, "token_type": "bearer",
            "typ": "client", "role": "client",
            "name": client_user.name, "client_id": client_user.client_id,
            "company": client.company if client else "",
        }, token)
    raise HTTPException(status_code=401, detail="Invalid email or password.")


@router.get("/whoami")
def whoami(request: Request):
    """Server-truth session probe — works off the HttpOnly cookie."""
    p = _payload(request)
    return {
        "typ": p.get("typ"), "role": p.get("role"), "name": p.get("name"),
        "email": p.get("sub"), "client_id": p.get("client_id"),
    }


@router.post("/logout")
def logout():
    resp = JSONResponse({"ok": True})
    resp.delete_cookie(SESSION_COOKIE, path="/")
    return resp
