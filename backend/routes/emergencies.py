from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.emergency import Emergency
from models.user import User
from models.auditlog import AuditLog
from schemas.emergency import EmergencyStatusUpdate
from datetime import datetime

router = APIRouter(prefix="/emergencies", tags=["Emergencies"])

def emergency_to_dict(e, u):
    return {
        "emergency_id": e.emergency_id,
        "location": e.location,
        "status": e.status,
        "created_at": str(e.created_at) if e.created_at else "",
        "resolved_at": str(e.resolved_at) if e.resolved_at else "",
        "notes": getattr(e, "notes", ""),
        "resolution_notes": getattr(e, "resolution_notes", ""),
        "user_id": e.user_id,
        "user_name": u.user_name,
        "contact_num": u.contact_num,
        "profile_photo_path": getattr(u, "profile_photo_path", "")
    }

@router.get("/")
def get_emergencies(db: Session = Depends(get_db)):
    results = (
        db.query(Emergency, User)
        .join(User, Emergency.user_id == User.user_id)
        .order_by(Emergency.created_at.desc())
        .all()
    )
    return [emergency_to_dict(e, u) for e, u in results]

@router.get("/pending")
def get_pending_emergencies(db: Session = Depends(get_db)):
    results = (
        db.query(Emergency, User)
        .join(User, Emergency.user_id == User.user_id)
        .filter(Emergency.status == "pending")
        .order_by(Emergency.created_at.desc())
        .all()
    )
    return [emergency_to_dict(e, u) for e, u in results]

@router.patch("/{emergency_id}/status")
def update_emergency_status(emergency_id: int, payload: dict, db: Session = Depends(get_db)):
    emergency = db.query(Emergency).filter(Emergency.emergency_id == emergency_id).first()
    if not emergency:
        return {"error": "Emergency not found"}

    old_status = emergency.status
    new_status = payload.get("status")
    
    if new_status:
        emergency.status = new_status
        if new_status in ["resolved", "false_alarm"]:
            emergency.resolved_at = datetime.utcnow()
            
    if payload.get("notes"):
        emergency.notes = payload.get("notes")

    if payload.get("resolution_notes"):
        emergency.resolution_notes = payload.get("resolution_notes")

    # Record Audit Log if status changed
    if new_status and old_status != new_status:
        now = datetime.utcnow()
        audit_action_notes = payload.get("resolution_notes") or payload.get("notes")
        log = AuditLog(
            emergency_id = emergency_id,
            old_status = old_status,
            new_status = new_status,
            admin_id = payload.get("admin_id") or 1, # default to 1 if not passed
            action_notes = audit_action_notes,
            audit_date = now,
            created_at = now,
            updated_at = now
        )
        db.add(log)

    db.commit()
    db.refresh(emergency)
    
    return {"message": "Status updated", "emergency_id": emergency_id, "status": emergency.status}
