"""
Careers routes — staff manage roles and applications.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app import schemas
from app.deps import require_staff, require_admin

router = APIRouter(prefix="/api/careers", tags=["careers"])


@router.get("/roles", response_model=list[schemas.CareerRoleOut])
def list_roles(request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    return db.query(models.CareerRole).all()


@router.post("/roles", response_model=schemas.CareerRoleOut)
def create_role(payload: schemas.CareerRoleCreate, request: Request,
                db: Session = Depends(get_db), _=Depends(require_admin)):
    role = models.CareerRole(**payload.model_dump())
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.get("/applications", response_model=list[schemas.ApplicationOut])
def list_applications(request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    return db.query(models.Application).all()


@router.put("/applications/{app_id}", response_model=schemas.ApplicationOut)
def update_application(app_id: int, payload: dict, request: Request,
                       db: Session = Depends(get_db), _=Depends(require_staff())):
    app_ = db.get(models.Application, app_id)
    if not app_:
        raise HTTPException(status_code=404, detail="Application not found.")
    for k, v in payload.items():
        setattr(app_, k, v)
    db.commit()
    db.refresh(app_)
    return app_
