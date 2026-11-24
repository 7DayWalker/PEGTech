"""
Project routes — staff manage projects, clients view theirs.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app import schemas
from app.deps import require_staff, require_client

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(project_id: int, request, db: Session = Depends(get_db), _=Depends(require_staff)):
    project = db.get(models.Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    return project


@router.put("/{project_id}", response_model=schemas.ProjectOut)
def update_project(project_id: int, payload: schemas.ProjectUpdate, request,
                   db: Session = Depends(get_db), _=Depends(require_staff)):
    project = db.get(models.Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(project, k, v)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}")
def delete_project(project_id: int, request, db: Session = Depends(get_db), _=Depends(require_staff)):
    project = db.get(models.Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    db.delete(project)
    db.commit()
    return {"ok": True}
