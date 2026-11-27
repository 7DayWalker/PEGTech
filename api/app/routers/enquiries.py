"""
Enquiries routes — staff view and manage enquiries.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app.deps import require_staff

router = APIRouter(prefix="/api/enquiries", tags=["enquiries"])


# "" rather than "/" — same latent bug fixed in routers/audit.py: with a
# bare "/" route under a prefix, GET /api/enquiries (no trailing slash,
# the only way anything would ever actually call this) 404s outright
# because this app's SPA catch-all route intercepts it before Starlette's
# own redirect-slash handling can fire.
@router.get("")
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
