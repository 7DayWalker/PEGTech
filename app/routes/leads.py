"""
Lead management routes.
CRUD for leads, import preview, lead-level stats.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import uuid4

from app.database import get_db
from app.models import Lead, Niche
from app.schemas import (
    LeadOut, LeadCreate, LeadUpdate, LeadListResponse, ImportPreview,
)
from app.routes.auth import get_current_user

router = APIRouter()


def _lead_from_orm(lead) -> LeadOut:
    return LeadOut.model_validate(lead)


@router.get("/", response_model=LeadListResponse)
async def list_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    send_status: Optional[str] = Query(None),
    niche_id: Optional[int] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List leads for the current user with pagination and filters."""
    query = db.query(Lead).filter(Lead.user_id == current_user.id)

    if search:
        query = query.filter(Lead.business_name.ilike(f"%{search}%"))
    if send_status:
        query = query.filter(Lead.send_status == send_status)
    if niche_id:
        query = query.filter(Lead.niche_id == niche_id)

    total = query.count()
    offset = (page - 1) * page_size
    leads = query.order_by(Lead.created_at.desc()).offset(offset).limit(page_size).all()

    return LeadListResponse(
        leads=[_lead_from_orm(l) for l in leads],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
async def create_lead(
    lead: LeadCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a single lead."""
    # Validate niche if provided
    if lead.niche_id:
        niche = db.query(Niche).filter(
            Niche.id == lead.niche_id, Niche.user_id == current_user.id
        ).first()
        if not niche:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Niche not found",
            )

    db_lead = Lead(
        user_id=current_user.id,
        niche_id=lead.niche_id,
        business_name=lead.business_name,
        phone=lead.phone,
        address=lead.address,
        city=lead.city,
        state=lead.state,
        country=lead.country,
        email=lead.email,
        website=lead.website,
        rating=lead.rating,
        review_count=lead.review_count,
        email_confidence=lead.email_confidence,
        email_source=lead.email_source,
        send_status=lead.send_status,
        whatsapp_opt_in=lead.whatsapp_opt_in,
        email_opt_in=lead.email_opt_in,
        opt_out=lead.opt_out,
        notes=lead.notes,
        unsubscribe_token=str(uuid4()),
        preview_slug=f"lead-{uuid4().hex[:8]}",
    )
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return _lead_from_orm(db_lead)


@router.get("/{lead_id}", response_model=LeadOut)
async def get_lead(
    lead_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single lead by ID."""
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.user_id == current_user.id)
        .first()
    )
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    return _lead_from_orm(lead)


@router.patch("/{lead_id}", response_model=LeadOut)
async def update_lead(
    lead_id: int,
    update: LeadUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a lead."""
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.user_id == current_user.id)
        .first()
    )
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    data = update.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(lead, k, v)
    db.commit()
    db.refresh(lead)
    return _lead_from_orm(lead)


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(
    lead_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a lead."""
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.user_id == current_user.id)
        .first()
    )
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    db.delete(lead)
    db.commit()


@router.post("/import-preview", response_model=ImportPreview)
async def import_preview(
    file_path: str,
    current_user = Depends(get_current_user),
):
    """Preview a CSV import without saving."""
    import csv
    from pathlib import Path

    path = Path(file_path)
    if not path.exists():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File not found",
        )

    valid_rows = []
    errors = []

    try:
        with path.open(encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader, start=2):
                name = (
                    row.get("Business Name")
                    or row.get("business_name")
                    or ""
                ).strip()
                if not name:
                    errors.append(f"Row {i}: missing business name")
                    continue

                valid_rows.append({
                    "business_name": name,
                    "phone": row.get("Phone") or row.get("phone") or "",
                    "address": row.get("Address") or row.get("address") or "",
                    "city": row.get("City") or row.get("city") or "",
                    "state": row.get("State") or row.get("state") or "",
                    "email": row.get("Email") or row.get("email") or "",
                    "rating": row.get("Rating") or row.get("rating") or "",
                    "review_count": row.get("Review Count") or row.get("review_count") or "",
                })
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read CSV: {str(e)}",
        )

    return ImportPreview(
        total_rows=len(valid_rows),
        valid_rows=len(valid_rows),
        invalid_rows=0,
        preview=valid_rows[:10],
        errors=errors[:10],
    )