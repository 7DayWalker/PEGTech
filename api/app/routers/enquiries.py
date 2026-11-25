"""
Enquiries routes — staff view and manage enquiries.
"""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app.deps import require_staff

router = APIRouter(prefix="/api/enquiries", tags=["enquiries"])


@router.get("/")
def list_enquiries(request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    return db.query(models.Enquiry).order_by(models.Enquiry.created_at.desc()).all()


@router.put("/{enquiry_id}")
def update_enquiry(enquiry_id: int, payload: dict, request: Request,
                   db: Session = Depends(get_db), _=Depends(require_staff())):
    enquiry = db.get(models.Enquiry, enquiry_id)
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found.")
    for k, v in payload.items():
        setattr(enquiry, k, v)
    db.commit()
    db.refresh(enquiry)
    return enquiry
