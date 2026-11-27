"""
Client portal routes — client users manage their own data.
"""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from app.db import get_db
from app import escalation_detection, escalation_summary, models
from app import schemas
from app.deps import require_client

router = APIRouter(prefix="/api/clients", tags=["clients"])


@router.get("/me")
def client_me(request: Request, db: Session = Depends(get_db), user=Depends(require_client)):
    client = db.get(models.Client, user.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")
    return {
        "user": user,
        "client": client,
    }


@router.get("/projects", response_model=list[schemas.ProjectOut])
def client_projects(request: Request, db: Session = Depends(get_db), user=Depends(require_client)):
    client = db.get(models.Client, user.client_id)
    return client.projects


@router.get("/deliverables", response_model=list[schemas.DeliverableOut])
def client_deliverables(request: Request, db: Session = Depends(get_db), user=Depends(require_client)):
    return db.query(models.Deliverable).filter_by(client_id=user.client_id).all()


@router.get("/updates", response_model=list[schemas.WeeklyUpdateOut])
def client_updates(request: Request, db: Session = Depends(get_db), user=Depends(require_client)):
    return (db.query(models.WeeklyUpdate)
            .filter_by(client_id=user.client_id, status="published")
            .order_by(models.WeeklyUpdate.created_at.desc()).all())


@router.get("/documents", response_model=list[schemas.DocumentOut])
def client_documents(request: Request, db: Session = Depends(get_db), user=Depends(require_client)):
    return db.query(models.Document).filter_by(client_id=user.client_id, is_public=True).all()


@router.get("/messages", response_model=list[schemas.ClientMessageOut])
def client_messages(request: Request, db: Session = Depends(get_db), user=Depends(require_client)):
    return db.query(models.ClientMessage).filter_by(client_id=user.client_id).order_by(
        models.ClientMessage.created_at.desc()).limit(50).all()


@router.post("/messages", response_model=schemas.ClientMessagePostResult)
def client_send_message(
    payload: schemas.ClientMessageIn,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(require_client),
):
    """A client posting into their dashboard inbox thread — previously this
    endpoint only supported GET (reading seeded/staff-sent messages), so a
    client had no real way to write back. This both fixes that gap and
    doubles as the client-side escalation trigger: a message is routed to
    the staff Escalations queue when either the client explicitly flags it
    for staff, or the message reads as frustrated/urgent on its own."""
    message = models.ClientMessage(
        client_id=user.client_id,
        sender="client",
        author=user.name,
        body=payload.body,
    )
    db.add(message)

    auto_reason = escalation_detection.detect_escalation(payload.body)
    escalate = payload.flag_for_staff or auto_reason is not None
    if escalate:
        reason = "Client flagged this message for staff attention" if payload.flag_for_staff else auto_reason
        esc = models.Escalation(
            source="client_portal",
            client_id=user.client_id,
            lead_id=None,
            session_id=None,
            summary=payload.body[:300],
            transcript=payload.body,
            reason=reason,
            sentiment="negative" if auto_reason else "flagged",
            status="queued",
        )
        db.add(esc)
        db.flush()  # assign esc.id before the background task needs to look it up
        background_tasks.add_task(escalation_summary.summarize_and_save_background, esc.id)

    db.commit()
    db.refresh(message)

    return {"message": message, "escalated": escalate}
