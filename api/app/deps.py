"""
Authentication dependencies: JWT from header or HttpOnly cookie.
"""
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.security import decode_token
from app import models


def _candidates(request: Request) -> list[str]:
    out: list[str] = []
    auth = request.headers.get("authorization") or ""
    if auth.lower().startswith("bearer ") and len(auth) > 7:
        out.append(auth[7:].strip())
    cookie = request.cookies.get("pegtech_session")
    if cookie:
        out.append(cookie)
    q = request.query_params.get("access_token")
    if q:
        out.append(q)
    return out


def _payload(request: Request) -> dict:
    """Validate the first usable credential: header, cookie, or query param."""
    for token in _candidates(request):
        try:
            return decode_token(token)
        except Exception:
            continue
    if _candidates(request):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired or invalid — please sign in again.")
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign-in required.")


def require_staff(*roles: str):
    """Dependency factory: staff session, optionally role-restricted."""
    def dep(request: Request, db: Session = Depends(get_db)) -> models.AdminUser:
        payload = _payload(request)
        if payload.get("typ") != "staff":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff sign-in required.")
        email = payload.get("sub")
        user = db.query(models.AdminUser).filter_by(email=email).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown account.")
        if roles and user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your role does not include this area.")
        return user
    return dep


def require_admin(request: Request, db: Session = Depends(get_db)) -> models.AdminUser:
    payload = _payload(request)
    if payload.get("typ") != "staff":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff sign-in required.")
    user = db.query(models.AdminUser).filter_by(email=payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown account.")
    return user


def require_client(request: Request, db: Session = Depends(get_db)) -> models.ClientUser:
    payload = _payload(request)
    if payload.get("typ") != "client":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Client sign-in required.")
    user = db.query(models.ClientUser).filter_by(email=payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown account.")
    return user
