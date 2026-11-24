"""
Client portal routes — client users manage their own data.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.db import get_db
from app import models
from app import schemas
from app.deps import require_client

router = APIRouter(prefix="/api/clients", tags=["clients"])


@router.get("/me")
def client_me(request, db: Session = Depends(get_db), user=Depends(require_client)):
    client = db.get(models.Client, user.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")
    return {
        "user": user,
        "client": client,
    }


@router.get("/projects", response_model=list[schemas.ProjectOut])
def client_projects(request, db: Session = Depends(get_db), user=Depends(require_client)):
    client = db.get(models.Client, user.client_id)
    return client.projects


@router.get("/deliverables", response_model=list[schemas.DeliverableOut])
def client_deliverables(request, db: Session = Depends(get_db), user=Depends(require_client)):
    return db.query(models.Deliverable).filter_by(client_id=user.client_id).all()


@router.get("/updates", response_model=list[schemas.WeeklyUpdateOut])
def client_updates(request, db: Session = Depends(get_db), user=Depends(require_client)):
    return (db.query(models.WeeklyUpdate)
            .filter_by(client_id=user.client_id, status="published")
            .order_by(models.WeeklyUpdate.created_at.desc()).all())


@router.get("/documents", response_model=list[schemas.DocumentOut])
def client_documents(request, db: Session = Depends(get_db), user=Depends(require_client)):
    return db.query(models.Document).filter_by(client_id=user.client_id, is_public=True).all()


@router.get("/messages")
def client_messages(request, db: Session = Depends(get_db), user=Depends(require_client)):
    return db.query(models.ClientMessage).filter_by(client_id=user.client_id).order_by(
        models.ClientMessage.created_at.desc()).limit(50).all()
