"""
Serves binary media (images, voice notes, documents) attached to WhatsApp
messages — stored directly in Postgres as MediaAsset rows.

A plain <img src="..."> / <audio src="..."> tag can't attach a custom
Authorization header, so this relies on deps.require_staff()'s existing
support for a `?access_token=` query-param credential (the same fallback
already used for sandboxed-iframe/proxy environments that strip headers).
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db import get_db
from app import models
from app.deps import require_staff

router = APIRouter(prefix="/api/media", tags=["media"])


@router.get("/{media_id}")
def get_media(media_id: int, request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    asset = db.get(models.MediaAsset, media_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Media not found.")
    headers = {"Cache-Control": "private, max-age=86400"}
    if asset.filename:
        headers["Content-Disposition"] = f'inline; filename="{asset.filename}"'
    return Response(content=asset.data, media_type=asset.mime_type, headers=headers)
