"""
Send log routes.
View individual message send records and stats.
"""
from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Send
from app.schemas import SendOut, SendStats
from app.routes.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[SendOut])
async def list_sends(
    campaign_id: Optional[int] = Query(None),
    channel: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List send records for the current user with optional filters."""
    query = db.query(Send).filter(Send.user_id == current_user.id)

    if campaign_id:
        query = query.filter(Send.campaign_id == campaign_id)
    if channel:
        query = query.filter(Send.channel == channel)
    if status:
        query = query.filter(Send.status == status)

    return query.order_by(Send.created_at.desc()).all()


@router.get("/stats", response_model=SendStats)
async def send_stats(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get aggregate send statistics."""
    rows = db.query(Send).filter(Send.user_id == current_user.id).all()
    return SendStats(
        total=len(rows),
        email_sent=sum(1 for r in rows if r.channel == "email" and r.status == "sent"),
        whatsapp_sent=sum(1 for r in rows if r.channel == "whatsapp" and r.status == "sent"),
        failed=sum(1 for r in rows if r.status == "failed"),
        pending=sum(1 for r in rows if r.status == "pending"),
    )