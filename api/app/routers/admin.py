"""
Admin routes — staff-only management.
"""
import logging
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, Request, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from app.db import get_db, SessionLocal
from app import models
from app import schemas
from app.deps import require_staff, require_admin
from app import notifications
from app import lead_import
from app import lead_scoring
from app.phone_utils import phones_match
from app.briefing import build_briefing

router = APIRouter(prefix="/api/admin", tags=["admin"])
logger = logging.getLogger("pegtech.admin")

# Plenty for a research spreadsheet with thousands of rows; keeps upload
# parsing bounded and fast.
MAX_IMPORT_BYTES = 10 * 1024 * 1024  # 10MB

# AI-scoring a huge batch synchronously would make /leads/import hang far
# past any reasonable HTTP timeout (each AI call can take several seconds,
# longer if it falls through multiple chain tiers) — so scoring runs as a
# background task after the response is sent, capped to this many leads
# per import so one enormous spreadsheet can't run up the AI bill or the
# background task's own runtime unbounded. Comfortably covers a normal
# research-sheet batch (tested against real ~30-40 row sheets); anything
# beyond this cap can be scored later via the manual re-score button.
MAX_AUTO_SCORE_PER_IMPORT = 50


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


# ── Daily Briefing — "what needs attention today" ──
@router.get("/briefing")
def admin_briefing(request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    return build_briefing(db)


# ── Staff directory (for assignment dropdowns) ──
@router.get("/staff", response_model=list[schemas.AdminUserMiniOut])
def list_staff(request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    return db.query(models.AdminUser).filter_by(is_active=True).order_by(models.AdminUser.name).all()


def _unread_ids(db: Session, model, fk_column) -> set[int]:
    """IDs of leads/clients with an inbound WhatsApp/email message newer than
    their last_read_at (or that have never been read at all). Powers the
    'unread' badge on the Leads/Clients list pages — a single query, not
    N+1, so it's cheap to run on every list load."""
    rows = (
        db.query(fk_column)
        .join(model, model.id == fk_column)
        .filter(models.MessageLog.direction == "inbound")
        .filter(fk_column.isnot(None))
        .filter(
            (model.last_read_at.is_(None)) | (models.MessageLog.created_at > model.last_read_at)
        )
        .distinct()
        .all()
    )
    return {row[0] for row in rows}


# ── Clients ──
@router.get("/clients", response_model=list[schemas.ClientOut])
def list_clients(request: Request, db: Session = Depends(get_db), _=Depends(require_staff())):
    clients = db.query(models.Client).options(
        joinedload(models.Client.strategist),
        joinedload(models.Client.delivery_lead),
        joinedload(models.Client.success_lead),
    ).all()
    unread = _unread_ids(db, models.Client, models.MessageLog.client_id)
    for c in clients:
        c.has_unread = c.id in unread
    return clients


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
    leads = db.query(models.Lead).all()
    unread = _unread_ids(db, models.Lead, models.MessageLog.lead_id)
    for l in leads:
        l.has_unread = l.id in unread
    return leads


@router.get("/leads/top-priority", response_model=list[schemas.LeadOut])
def top_priority_leads(request: Request, limit: int = 5,
                        db: Session = Depends(get_db), _=Depends(require_staff())):
    """The Dashboard's \"Top priority leads\" widget — leads with the
    highest AI score that haven't been won or lost yet. Leads never
    AI-scored (ai_score IS NULL) are excluded rather than sorted to the
    bottom with an implicit 0, since \"never scored\" and \"scored 0, a
    dead end\" are different things a staff member shouldn't confuse."""
    limit = max(1, min(limit, 20))
    return (
        db.query(models.Lead)
        .filter(models.Lead.ai_score.isnot(None))
        .filter(models.Lead.stage < 4)
        .order_by(models.Lead.ai_score.desc())
        .limit(limit)
        .all()
    )


def _find_duplicate_lead(existing: list[models.Lead], fields: dict) -> models.Lead | None:
    """Matches a freshly-imported row against leads already in the system,
    so re-uploading an updated/enriched research sheet (e.g. a follow-up
    email-finding pass on the same business list) fills in the gaps on
    existing leads instead of creating duplicates. Checked in order of
    reliability: phone number, then email, then business name (gated by
    city/state, see below).

    The business-name tier intentionally does NOT gate on city — tested
    against real research data, a single real business ("One Way Roofing
    & Construction LLC") came back scoped as "Tulsa" from one Google-Maps
    search pass but with a precise street address in "Owasso" (a Tulsa
    suburb) from a later pass — same business, disagreeing city strings.
    Requiring city agreement would have wrongly treated that as two
    businesses and blocked the merge, defeating the point of re-uploads.

    It DOES gate on state when both sides have one and they disagree —
    state is a far more reliable signal than city (metro/suburb naming
    varies constantly; state essentially never does for the same real
    business), and this gate is justified by a real finding in the same
    research data: one note for a "Clevenger Roofing" lead explicitly
    flags "Ohio BBB result is a different Clevenger Roofing; do not use"
    — i.e. two unrelated businesses sharing an identical name is a
    real, observed risk this guards against."""
    phone = fields.get("phone")
    if phone:
        for lead in existing:
            if lead.phone and phones_match(lead.phone, phone):
                return lead

    email = fields.get("email")
    if email:
        email_l = email.strip().lower()
        for lead in existing:
            if lead.email and lead.email.strip().lower() == email_l:
                return lead

    business_name = fields.get("business_name")
    if business_name:
        bn_l = business_name.strip().lower()
        state_l = (fields.get("state") or "").strip().lower()
        for lead in existing:
            if (lead.business_name or "").strip().lower() != bn_l:
                continue
            existing_state = (lead.state or "").strip().lower()
            if state_l and existing_state and state_l != existing_state:
                continue  # same name, different state — different business, don't merge
            return lead

    return None


def _score_leads_background(lead_ids: list[int]) -> None:
    """Runs after an import's HTTP response has already been sent — each
    AI call can take several seconds (longer if it falls through chain
    tiers), so doing this inline would make /leads/import hang well past
    any reasonable request timeout for anything but a tiny file. Needs its
    own DB session since the request-scoped one is closed by the time this
    runs; commits one lead at a time so a mid-batch crash or AI outage
    doesn't lose the leads already scored before it."""
    db = SessionLocal()
    try:
        for lead_id in lead_ids:
            lead = db.get(models.Lead, lead_id)
            if lead is None:
                continue
            try:
                result = lead_scoring.score_lead_ai(lead)
            except Exception as e:  # noqa: BLE001 — one bad lead must not stop the batch
                logger.warning("background scoring failed for lead %s: %s", lead_id, e)
                continue
            lead.ai_score = result["ai_score"]
            lead.ai_score_reason = result["reasoning"]
            lead.ai_score_provider = result["ai_provider"]
            lead.ai_scored_at = datetime.utcnow()
            db.commit()
    finally:
        db.close()


@router.post("/leads/import")
async def import_leads(request: Request, background_tasks: BackgroundTasks, file: UploadFile = File(...),
                        db: Session = Depends(get_db), _=Depends(require_staff())):
    """Bulk-populate the Leads pipeline from a research spreadsheet (CSV or
    XLSX) instead of entering businesses one at a time — the primary
    top-of-funnel alongside (or instead of) paid ad campaigns. Re-uploading
    an updated sheet is safe: matching rows enrich the existing lead's
    blank fields rather than creating duplicates. New and meaningfully-
    updated leads are AI-scored in the background after this returns (see
    _score_leads_background), up to MAX_AUTO_SCORE_PER_IMPORT per call."""
    data = await file.read()
    if len(data) > MAX_IMPORT_BYTES:
        raise HTTPException(status_code=413, detail=f"File too large — max {MAX_IMPORT_BYTES // (1024*1024)}MB.")
    if not data:
        raise HTTPException(status_code=400, detail="Empty file.")

    try:
        rows = lead_import.parse_spreadsheet(data, file.filename or "")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Couldn't read this as a CSV or Excel file: {e}")

    if not rows:
        raise HTTPException(
            status_code=400,
            detail="No data rows found — make sure the file has a header row followed by at least one row of data.",
        )

    existing_leads = db.query(models.Lead).all()
    created = updated = skipped = 0
    warnings: list[dict] = []
    # Leads worth (re-)scoring once this import commits: every newly
    # created lead, plus any existing lead whose data actually changed
    # (new notes/phone/email etc. — not just touched with nothing new).
    to_score: list[int] = []

    for row_num, raw_row in enumerate(rows, start=2):  # row 1 is the header
        mapped = lead_import.map_row(raw_row)
        if mapped is None:
            skipped += 1
            continue

        fields = mapped.fields
        match = _find_duplicate_lead(existing_leads, fields)
        if match is not None:
            changed = False
            for key, value in fields.items():
                if not value or key == "stage":
                    continue
                if key == "notes":
                    # Research notes accumulate across re-uploads (e.g. a
                    # later email-enrichment pass on the same business)
                    # rather than only filling in if blank, so later
                    # findings aren't silently lost once a lead has any
                    # notes at all.
                    current_notes = (match.notes or "").strip()
                    if value not in current_notes:
                        match.notes = f"{current_notes}\n\n{value}".strip() if current_notes else value
                        changed = True
                    continue
                if not getattr(match, key, None):
                    setattr(match, key, value)
                    changed = True
            if changed:
                updated += 1
                if len(to_score) < MAX_AUTO_SCORE_PER_IMPORT:
                    to_score.append(match.id)
        else:
            lead = models.Lead(**fields)
            db.add(lead)
            db.flush()  # so later rows in this same file can dedupe against it
            existing_leads.append(lead)
            created += 1
            if len(to_score) < MAX_AUTO_SCORE_PER_IMPORT:
                to_score.append(lead.id)

        label = fields.get("business_name") or fields.get("name")
        for w in mapped.warnings:
            warnings.append({"row": row_num, "business_name": label, "message": w})

    db.commit()

    if to_score:
        background_tasks.add_task(_score_leads_background, to_score)

    return {
        "total_rows": len(rows),
        "created": created,
        "updated": updated,
        "skipped": skipped,
        "warnings": warnings[:50],
        "ai_scoring_queued": len(to_score),
    }


@router.post("/leads", response_model=schemas.LeadOut)
def create_lead(payload: schemas.LeadCreate, request: Request,
                db: Session = Depends(get_db), _=Depends(require_staff())):
    lead = models.Lead(**payload.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.post("/leads/{lead_id}/score", response_model=schemas.LeadOut)
def rescore_lead(lead_id: int, request: Request,
                  db: Session = Depends(get_db), _=Depends(require_staff())):
    """Manual \"Re-score\" button on a single lead — synchronous since
    it's one AI call, not a batch (unlike the import's background path)."""
    lead = db.get(models.Lead, lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found.")
    result = lead_scoring.score_lead_ai(lead)
    lead.ai_score = result["ai_score"]
    lead.ai_score_reason = result["reasoning"]
    lead.ai_score_provider = result["ai_provider"]
    lead.ai_scored_at = datetime.utcnow()
    db.commit()
    db.refresh(lead)
    return lead


def _convert_won_lead_to_client(db: Session, lead: models.Lead) -> None:
    """Auto-create a Client when a lead first reaches the 'Won' stage (4).
    Idempotent via lead.converted_client_id — fires exactly once per lead,
    even if it's later edited again while staying on/returning to Won. The
    lead record itself is untouched otherwise: this only ever adds a Client,
    never deletes or mutates the lead."""
    if lead.converted_client_id is not None:
        return
    client = models.Client(
        company=lead.business_name or lead.name,
        contact_name=lead.name,
        email=lead.email,
        phone=lead.phone,
        status="active",
    )
    db.add(client)
    db.flush()  # assign client.id without a full commit yet
    lead.converted_client_id = client.id
    db.commit()
    db.refresh(lead)


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
    if old_stage != 4 and lead.stage == 4:
        _convert_won_lead_to_client(db, lead)
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
