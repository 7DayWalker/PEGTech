"""
Niche (industry vertical) management routes.
Users can create niches like Roofing, Plumbing, HVAC, Electrical, etc.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Niche, User
from app.schemas import NicheCreate, NicheUpdate, NicheOut
from app.routes.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[NicheOut])
async def list_niches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List niches for the current user."""
    return db.query(Niche).filter(Niche.user_id == current_user.id).all()


@router.post("/", response_model=NicheOut, status_code=status.HTTP_201_CREATED)
async def create_niche(
    niche: NicheCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new niche."""
    existing = (
        db.query(Niche)
        .filter(Niche.user_id == current_user.id, Niche.slug == niche.slug)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Niche with this slug already exists",
        )

    db_niche = Niche(
        user_id=current_user.id,
        name=niche.name,
        slug=niche.slug,
        description=niche.description,
    )
    db.add(db_niche)
    db.commit()
    db.refresh(db_niche)
    return db_niche


@router.get("/{niche_id}", response_model=NicheOut)
async def get_niche(
    niche_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a niche by ID."""
    niche = (
        db.query(Niche)
        .filter(Niche.id == niche_id, Niche.user_id == current_user.id)
        .first()
    )
    if not niche:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Niche not found")
    return niche


@router.patch("/{niche_id}", response_model=NicheOut)
async def update_niche(
    niche_id: int,
    update: NicheUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a niche."""
    niche = (
        db.query(Niche)
        .filter(Niche.id == niche_id, Niche.user_id == current_user.id)
        .first()
    )
    if not niche:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Niche not found")

    data = update.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(niche, k, v)
    db.commit()
    db.refresh(niche)
    return niche


@router.delete("/{niche_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_niche(
    niche_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a niche."""
    niche = (
        db.query(Niche)
        .filter(Niche.id == niche_id, Niche.user_id == current_user.id)
        .first()
    )
    if not niche:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Niche not found")
    db.delete(niche)
    db.commit()