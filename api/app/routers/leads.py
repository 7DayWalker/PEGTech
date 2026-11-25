"""
Lead routes — staff manage leads.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app import schemas
from app.deps import require_staff

router = APIRouter(prefix="/api/leads", tags=["leads"])


@router.get("/", response_model=list[schemas.LeadOut])
def list_leads(request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    return db.query(models.Lead).all()


@router.get("/{lead_id}", response_model=schemas.LeadOut)
def get_lead(lead_id: int, request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    lead = db.get(models.Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")
    return lead


@router.put("/{lead_id}", response_model=schemas.LeadOut)
def update_lead(lead_id: int, payload: schemas.LeadUpdate, request: Request,
                db: Session = Depends(get_db), _=Depends(require_staff())):
    lead = db.get(models.Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(lead, k, v)
    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}")
def delete_lead(lead_id: int, request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    lead = db.get(models.Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")
    db.delete(lead)
    db.commit()
    return {"ok": True}
