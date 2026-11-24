"""
Booking routes — public bookings, staff manage.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app import schemas
from app.deps import require_staff
from app.services import slot_is_supported
import uuid

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.get("/", response_model=list[schemas.BookingOut])
def list_bookings(request, db: Session = Depends(get_db), _=Depends(require_staff)):
    return db.query(models.Booking).all()


@router.put("/{booking_id}", response_model=schemas.BookingOut)
def update_booking(booking_id: int, payload: dict, request,
                   db: Session = Depends(get_db), _=Depends(require_staff)):
    booking = db.get(models.Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if "ai_summary" in payload:
        booking.ai_summary = payload["ai_summary"]
    db.commit()
    db.refresh(booking)
    return booking
