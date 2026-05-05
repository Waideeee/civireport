from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.emergency import Emergency
from models.user import User
from models.auditlog import AuditLog
from schemas.emergency import EmergencyResponse, EmergencyStatusUpdate
from security import require_admin_actor
from datetime import datetime

router = APIRouter(prefix="/emergencies", tags=["Emergencies"])

def emergency_to_dict(e, u):
    return {
        "emergency_id": e.emergency_id,
        "address": e.address,
        "location": e.address,
        "status": e.status,
        "created_at": str(e.created_at) if e.created_at else "",
        "resolved_at": str(e.resolved_at) if e.resolved_at else "",
        "notes": getattr(e, "notes", ""),
        "resolution_notes": getattr(e, "resolution_notes", ""),
        "user_id": e.user_id,
        "reporter_name": u.user_name if u else "",
        "reporter_contact": u.contact_num if u else "",
        "user_name": u.user_name if u else "",
        "contact_num": u.contact_num if u else "",
        "profile_photo_path": getattr(u, "profile_photo_path", "") if u else "",
    }

@router.get("/", response_model=list[EmergencyResponse])
def get_emergencies(db: Session = Depends(get_db)):
    results = (
        db.query(Emergency, User)
        .outerjoin(User, Emergency.user_id == User.user_id)
        .order_by(Emergency.created_at.desc())
        .all()
    )
    return [emergency_to_dict(e, u) for e, u in results]

@router.get("/pending", response_model=list[EmergencyResponse])
def get_pending_emergencies(db: Session = Depends(get_db)):
    results = (
        db.query(Emergency, User)
        .outerjoin(User, Emergency.user_id == User.user_id)
        .filter(Emergency.status == "pending")
        .order_by(Emergency.created_at.desc())
        .all()
    )
    return [emergency_to_dict(e, u) for e, u in results]

@router.patch("/{emergency_id}/status", dependencies=[Depends(require_admin_actor)])
def update_emergency_status(
    emergency_id: int,
    payload: EmergencyStatusUpdate,
    db: Session = Depends(get_db),
    x_civireport_actor_id: str | None = Header(default=None, alias="X-CiviReport-Actor-Id"),
):
    emergency = db.query(Emergency).filter(Emergency.emergency_id == emergency_id).first()
    if not emergency:
        return {"error": "Emergency not found"}

    old_status = emergency.status
    new_status = payload.status

    try:
        admin_id = int(x_civireport_actor_id) if x_civireport_actor_id else None
    except (ValueError, TypeError):
        admin_id = None

    if new_status:
        emergency.status = new_status
        if new_status in ["resolved", "false_alarm"]:
            emergency.resolved_at = datetime.utcnow()

    if payload.notes:
        emergency.notes = payload.notes

    if payload.resolution_notes:
        emergency.resolution_notes = payload.resolution_notes

    # Record Audit Log if status changed
    if new_status and old_status != new_status:
        now = datetime.utcnow()
        audit_action_notes = payload.resolution_notes or payload.notes
        actor = db.query(User).filter(User.user_id == admin_id).first() if admin_id else None
        log = AuditLog(
            emergency_id = emergency_id,
            old_status = old_status,
            new_status = new_status,
            user_id = admin_id,
            user_name = actor.user_name if actor else None,
            action_notes = audit_action_notes,
            audit_date = now,
            created_at = now,
            updated_at = now
        )
        db.add(log)

    db.commit()
    db.refresh(emergency)

    return {"message": "Status updated", "emergency_id": emergency_id, "status": emergency.status}
