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
    forwarded = (request.headers.get("x-forwarded-proto") or "").split(",")[0].strip().lower()
    https = request.url.scheme == "https" or forwarded == "https"
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
