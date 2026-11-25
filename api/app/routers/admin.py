"""
Admin routes — staff-only management.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session, joinedload
from app.db import get_db
from app import models
from app import schemas
from app.deps import require_staff, require_admin
from app import notifications

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Dashboard stats ──
@router.get("/stats")
def admin_stats(request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    return {
        "total_clients": db.query(models.Client).count(),
        "total_projects": db.query(models.Project).count(),
        "total_leads": db.query(models.Lead).count(),
        "active_campaigns": db.query(models.Campaign).filter_by(status="active").count(),
        "pending_escalations": db.query(models.Escalation).filter_by(status="queued").count(),
        "total_users": db.query(models.AdminUser).count() + db.query(models.ClientUser).count(),
    }


# ── Staff directory (for assignment dropdowns) ──
@router.get("/staff", response_model=list[schemas.AdminUserMiniOut])
def list_staff(request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    return db.query(models.AdminUser).filter_by(is_active=True).order_by(models.AdminUser.name).all()


# ── Clients ──
@router.get("/clients", response_model=list[schemas.ClientOut])
def list_clients(request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    return db.query(models.Client).options(
        joinedload(models.Client.strategist),
        joinedload(models.Client.delivery_lead),
        joinedload(models.Client.success_lead),
    ).all()


@router.post("/clients", response_model=schemas.ClientOut)
def create_client(payload: schemas.ClientCreate, request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    client = models.Client(**payload.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.put("/clients/{client_id}", response_model=schemas.ClientOut)
def update_client(client_id: int, payload: schemas.ClientUpdate, request: Request,
                  db: Session = Depends(get_db), _=Depends(require_staff())):
    client = db.get(models.Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(client, k, v)
    db.commit()
    db.refresh(client)
    return client


# ── Projects ──
@router.get("/projects", response_model=list[schemas.ProjectOut])
def list_projects(request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    return db.query(models.Project).all()


@router.post("/projects", response_model=schemas.ProjectOut)
def create_project(payload: schemas.ProjectCreate, request: Request,
                   db: Session = Depends(get_db), _=Depends(require_staff())):
    project = models.Project(**payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


# ── Leads ──
@router.get("/leads", response_model=list[schemas.LeadOut])
def list_leads(request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    return db.query(models.Lead).all()


@router.post("/leads", response_model=schemas.LeadOut)
def create_lead(payload: schemas.LeadCreate, request: Request,
                db: Session = Depends(get_db), _=Depends(require_staff())):
    lead = models.Lead(**payload.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.put("/leads/{lead_id}", response_model=schemas.LeadOut)
def update_lead(lead_id: int, payload: schemas.LeadUpdate, request: Request,
                db: Session = Depends(get_db), _=Depends(require_staff())):
    lead = db.get(models.Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")
    old_stage = lead.stage
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(lead, k, v)
    db.commit()
    db.refresh(lead)
    notifications.notify_lead_stage_change(db, lead, old_stage, lead.stage)
    return lead


# ── Campaigns ──
@router.get("/campaigns", response_model=list[schemas.CampaignOut])
def list_campaigns(request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    return db.query(models.Campaign).all()


@router.post("/campaigns", response_model=schemas.CampaignOut)
def create_campaign(payload: schemas.CampaignCreate, request: Request,
                    db: Session = Depends(get_db), _=Depends(require_staff())):
    user = _get_current_user(request, db)
    campaign = models.Campaign(**payload.model_dump(), owner_id=user.id)
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


# ── Escalations ──
@router.get("/escalations", response_model=list[schemas.EscalationOut])
def list_escalations(request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    return db.query(models.Escalation).all()


@router.put("/escalations/{esc_id}", response_model=schemas.EscalationOut)
def resolve_escalation(esc_id: int, payload: schemas.EscalationCreate, request: Request,
                       db: Session = Depends(get_db), _=Depends(require_staff())):
    esc = db.get(models.Escalation, esc_id)
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found.")
    esc.status = "resolved"
    esc.resolve_note = payload.summary
    db.commit()
    db.refresh(esc)
    return esc


# ── Careers ──
@router.get("/careers/roles", response_model=list[schemas.CareerRoleOut])
def list_roles_admin(request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    return db.query(models.CareerRole).all()


@router.post("/careers/roles", response_model=schemas.CareerRoleOut)
def create_role(payload: schemas.CareerRoleCreate, request: Request,
                db: Session = Depends(get_db), _=Depends(require_admin)):
    role = models.CareerRole(**payload.model_dump())
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.get("/careers/applications", response_model=list[schemas.ApplicationOut])
def list_applications(request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    return db.query(models.Application).all()


# ── QA Reviews ──
@router.get("/qa", response_model=list[schemas.QAReviewOut])
def list_qa(request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    return db.query(models.QAReview).all()


def _get_current_user(request: Request, db: Session) -> models.AdminUser:
    from app.deps import _payload
    payload = _payload(request)
    email = payload.get("sub")
    return db.query(models.AdminUser).filter_by(email=email).first()
