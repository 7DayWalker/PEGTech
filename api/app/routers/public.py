"""
Public routes: home data, services, booking, audit, enquiries, careers, faqs.
"""
import json
import uuid
from datetime import date as d
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app import schemas
from app.services import compute_audit, availability, slot_is_supported, flag_answer

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/services")
def list_services():
    return [
        {"name": "Web Development", "description": "Custom websites and web applications", "icon": "globe"},
        {"name": "AI Solutions", "description": "AI agents, automation, and machine learning", "icon": "cpu"},
        {"name": "Digital Marketing", "description": "SEO, content, and campaign management", "icon": "megaphone"},
        {"name": "Brand & Design", "description": "Visual identity and UI/UX design", "icon": "palette"},
        {"name": "Tech Consulting", "description": "Technology strategy and architecture", "icon": "headset"},
    ]


@router.get("/faqs")
def list_faqs(db: Session = Depends(get_db)):
    return db.query(models.Faq).order_by(models.Faq.sort).all()


@router.post("/audit", response_model=schemas.AuditOut)
def run_audit(payload: schemas.AuditIn, db: Session = Depends(get_db)):
    result = compute_audit(payload.industry, payload.leads, payload.response, payload.pipeline, payload.deal)
    report = models.AuditReport(
        industry=payload.industry, leads_band=payload.leads,
        response_time=payload.response, pipeline=payload.pipeline,
        deal_band=payload.deal, annual_leak_usd=result["annual_leak_usd"],
        monthly_leak_usd=result["monthly_leak_usd"],
        ad_waste_usd=result["ad_waste_usd"], risk_pct=result["risk_pct"],
        email=payload.email,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return result


@router.get("/audit/reports")
def list_audit_reports(db: Session = Depends(get_db)):
    return db.query(models.AuditReport).order_by(models.AuditReport.created_at.desc()).limit(50).all()


@router.post("/enquiries")
def create_enquiry(payload: dict, db: Session = Depends(get_db)):
    from app.schemas import EnquiryIn
    enquiry_data = EnquiryIn.model_validate(payload)
    enquiry = models.Enquiry(**enquiry_data.model_dump())
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)
    return {"ok": True, "id": enquiry.id}


@router.post("/bookings")
def create_booking(payload: schemas.BookingCreate, db: Session = Depends(get_db)):
    if not slot_is_supported(payload.day, payload.slot):
        raise HTTPException(status_code=400, detail="Slot not available.")
    existing = db.query(models.Booking).filter_by(day=payload.day, slot=payload.slot).first()
    if existing:
        raise HTTPException(status_code=409, detail="Slot already booked.")
    ref = "PC" + uuid.uuid4().hex[:8].upper()
    booking = models.Booking(**payload.model_dump(), ref=ref)
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/bookings/availability")
def booking_availability(day: str):
    target = d.fromisoformat(day)
    return availability(target)


@router.get("/careers/roles")
def list_career_roles(db: Session = Depends(get_db)):
    return db.query(models.CareerRole).filter_by(active=True).all()


@router.post("/careers/apply")
def apply_career(payload: schemas.ApplicationCreate, db: Session = Depends(get_db)):
    role = db.get(models.CareerRole, payload.role_id)
    if not role or not role.active:
        raise HTTPException(status_code=404, detail="Role not found.")
    flags = flag_answer(payload.experience)
    app_ = models.Application(**payload.model_dump(), flags=json.dumps(flags))
    db.add(app_)
    db.commit()
    db.refresh(app_)
    return {"ok": True, "id": app_.id, "flags": flags}
