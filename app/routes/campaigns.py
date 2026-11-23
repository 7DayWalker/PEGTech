"""
Campaign management routes.
Create campaigns and trigger sends to leads.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Campaign, Lead, Send
from app.schemas import (
    CampaignOut, CampaignCreate, CampaignUpdate, SendOut, SendStats,
)
from app.routes.auth import get_current_user
from app.services.email import email_service
from app.services.whatsapp import whatsapp_service

router = APIRouter()


def _campaign_from_orm(c) -> CampaignOut:
    return CampaignOut.model_validate(c)


@router.get("/", response_model=List[CampaignOut])
async def list_campaigns(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List campaigns for the current user."""
    return db.query(Campaign).filter(Campaign.user_id == current_user.id).order_by(Campaign.created_at.desc()).all()


@router.post("/", response_model=CampaignOut, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    campaign: CampaignCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new campaign."""
    db_campaign = Campaign(
        user_id=current_user.id,
        niche_id=campaign.niche_id,
        name=campaign.name,
        subject=campaign.subject,
        body_text=campaign.body_text,
        body_html=campaign.body_html,
        channel=campaign.channel,
        status="draft",
        total_leads=0,
        sent_count=0,
        replied_count=0,
        opt_out_count=0,
    )
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return _campaign_from_orm(db_campaign)


@router.get("/{campaign_id}", response_model=CampaignOut)
async def get_campaign(
    campaign_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a campaign by ID."""
    c = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
        .first()
    )
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return _campaign_from_orm(c)


@router.patch("/{campaign_id}", response_model=CampaignOut)
async def update_campaign(
    campaign_id: int,
    update: CampaignUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a campaign."""
    c = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
        .first()
    )
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    data = update.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return _campaign_from_orm(c)


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign(
    campaign_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a campaign."""
    c = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
        .first()
    )
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    db.delete(c)
    db.commit()


@router.post("/{campaign_id}/send", status_code=status.HTTP_202_ACCEPTED)
async def send_campaign(
    campaign_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send campaign messages to opted-in leads."""
    c = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
        .first()
    )
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    channel = c.channel
    leads = (
        db.query(Lead)
        .filter(Lead.user_id == current_user.id, Lead.opt_out == False)  # noqa: E712
        .all()
    )

    sent = 0
    for lead in leads:
        if channel == "email" and lead.email and lead.email_opt_in:
            try:
                result = await email_service.send(
                    to=lead.email,
                    subject=c.subject or "",
                    body_text=c.body_text or "",
                    body_html=c.body_html,
                    unsubscribe_token=lead.unsubscribe_token or "",
                    preview_url=lead.preview_url or "",
                )
                db.add(Send(
                    campaign_id=c.id,
                    user_id=current_user.id,
                    lead_id=lead.id,
                    channel="email",
                    recipient=lead.email,
                    subject=c.subject,
                    status="sent" if result.get("success") else "failed",
                    message_id=result.get("message_id"),
                    error=result.get("error"),
                ))
                if result.get("success"):
                    sent += 1
            except Exception as e:
                db.add(Send(
                    campaign_id=c.id,
                    user_id=current_user.id,
                    lead_id=lead.id,
                    channel="email",
                    recipient=lead.email,
                    subject=c.subject,
                    status="failed",
                    error=str(e),
                ))

        elif channel == "whatsapp" and lead.phone and lead.whatsapp_opt_in:
            try:
                result = await whatsapp_service.send(to=lead.phone, body=c.body_text or "")
                db.add(Send(
                    campaign_id=c.id,
                    user_id=current_user.id,
                    lead_id=lead.id,
                    channel="whatsapp",
                    recipient=lead.phone,
                    status="sent" if result.get("success") else "failed",
                    message_id=result.get("message_id"),
                    error=result.get("error"),
                ))
                if result.get("success"):
                    sent += 1
            except Exception as e:
                db.add(Send(
                    campaign_id=c.id,
                    user_id=current_user.id,
                    lead_id=lead.id,
                    channel="whatsapp",
                    recipient=lead.phone,
                    status="failed",
                    error=str(e),
                ))

    db.commit()

    # Update campaign stats
    c.status = "active"
    c.sent_count = sent
    c.total_leads = len(leads)
    db.commit()

    return {"message": f"Campaign sending started. {sent} messages sent out of {len(leads)} eligible leads."}