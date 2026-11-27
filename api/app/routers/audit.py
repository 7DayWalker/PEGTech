"""
Audit routes — staff view AI audit reports.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app import schemas
from app.deps import require_staff

router = APIRouter(prefix="/api/audit", tags=["audit"])


# "" rather than "/" — with prefix="/api/audit" that's the difference
# between matching exactly GET /api/audit and matching only GET
# /api/audit/ (trailing slash). The latter would normally 307-redirect a
# bare /api/audit request to the slash version, but this app's SPA
# catch-all route (registered last, in main.py) fully matches /api/audit
# first and 404s on anything starting with "api/" that didn't already
# match a real route, which happens before Starlette's redirect-slash
# logic ever gets a chance to fire. Confirmed live: GET /api/audit 404'd
# outright with zero API routers at fault — the route existed, it was
# just unreachable without a trailing slash nothing in this codebase
# actually sends.
@router.get("", response_model=list[schemas.AuditReportOut])
def list_audits(request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    return db.query(models.AuditReport).order_by(models.AuditReport.created_at.desc()).all()


@router.get("/{audit_id}", response_model=schemas.AuditReportOut)
def get_audit(audit_id: int, request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    report = db.get(models.AuditReport, audit_id)
    if not report:
        raise HTTPException(status_code=404, detail="Audit report not found.")
    return report
