"""
Audit routes — staff view AI audit reports.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app import schemas
from app.deps import require_staff

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("/", response_model=list[schemas.AuditReportOut])
def list_audits(request, db: Session = Depends(get_db), _=Depends(require_staff)):
    return db.query(models.AuditReport).order_by(models.AuditReport.created_at.desc()).all()


@router.get("/{audit_id}", response_model=schemas.AuditReportOut)
def get_audit(audit_id: int, request, db: Session = Depends(get_db), _=Depends(require_staff)):
    report = db.get(models.AuditReport, audit_id)
    if not report:
        raise HTTPException(status_code=404, detail="Audit report not found.")
    return report
