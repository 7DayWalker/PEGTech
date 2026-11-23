"""
Preview site routes.
Create, list, and serve generated preview sites for leads.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PreviewSite, Lead, Niche
from app.schemas import PreviewSiteOut, PreviewSiteCreate, PreviewSiteUpdate
from app.routes.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[PreviewSiteOut])
async def list_previews(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List preview sites for the current user."""
    return (
        db.query(PreviewSite)
        .filter(PreviewSite.user_id == current_user.id)
        .order_by(PreviewSite.created_at.desc())
        .all()
    )


@router.post("/", response_model=PreviewSiteOut, status_code=status.HTTP_201_CREATED)
async def create_preview(
    preview: PreviewSiteCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new preview site."""
    if preview.lead_id:
        lead = (
            db.query(Lead)
            .filter(Lead.id == preview.lead_id, Lead.user_id == current_user.id)
            .first()
        )
        if not lead:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Lead not found"
            )

    db_preview = PreviewSite(
        user_id=current_user.id,
        lead_id=preview.lead_id,
        niche_id=preview.niche_id,
        slug=preview.slug,
        title=preview.title,
        html_content=preview.html_content,
        is_public=preview.is_public,
    )
    db.add(db_preview)
    db.commit()
    db.refresh(db_preview)
    return db_preview


@router.get("/{preview_id}", response_model=PreviewSiteOut)
async def get_preview(
    preview_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a preview site by ID."""
    p = (
        db.query(PreviewSite)
        .filter(PreviewSite.id == preview_id, PreviewSite.user_id == current_user.id)
        .first()
    )
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preview site not found")
    return p


@router.patch("/{preview_id}", response_model=PreviewSiteOut)
async def update_preview(
    preview_id: int,
    update: PreviewSiteUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a preview site."""
    p = (
        db.query(PreviewSite)
        .filter(PreviewSite.id == preview_id, PreviewSite.user_id == current_user.id)
        .first()
    )
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preview site not found")

    data = update.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{preview_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_preview(
    preview_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a preview site."""
    p = (
        db.query(PreviewSite)
        .filter(PreviewSite.id == preview_id, PreviewSite.user_id == current_user.id)
        .first()
    )
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preview site not found")
    db.delete(p)
    db.commit()


@router.get("/public/{slug}")
async def get_public_preview(slug: str, db: Session = Depends(get_db)):
    """Get a public preview site by slug (no auth required)."""
    p = (
        db.query(PreviewSite)
        .filter(PreviewSite.slug == slug, PreviewSite.is_public == True)  # noqa: E712
        .first()
    )
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preview site not found")

    # Increment view count
    p.view_count = (p.view_count or 0) + 1
    db.commit()

    return {
        "slug": p.slug,
        "title": p.title,
        "html_content": p.html_content,
        "view_count": p.view_count,
    }