"""
Campaign routes — staff manage campaigns and sends.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app import schemas
from app.deps import require_staff

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])


@router.get("/", response_model=list[schemas.CampaignOut])
def list_campaigns(request, db: Session = Depends(get_db), _=Depends(require_staff)):
    return db.query(models.Campaign).all()


@router.post("/", response_model=schemas.CampaignOut)
def create_campaign(payload: schemas.CampaignCreate, request,
                    db: Session = Depends(get_db), _=Depends(require_staff)):
    from app.deps import _payload
    p = _payload(request)
    user = db.query(models.AdminUser).filter_by(email=p.get("sub")).first()
    campaign = models.Campaign(**payload.model_dump(), owner_id=user.id)
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.put("/{campaign_id}", response_model=schemas.CampaignOut)
def update_campaign(campaign_id: int, payload: schemas.CampaignUpdate, request,
                    db: Session = Depends(get_db), _=Depends(require_staff)):
    campaign = db.get(models.Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(campaign, k, v)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.get("/{campaign_id}/sends", response_model=list[schemas.SendOut])
def list_sends(campaign_id: int, request, db: Session = Depends(get_db), _=Depends(require_staff)):
    return db.query(models.CampaignSend).filter_by(campaign_id=campaign_id).all()
