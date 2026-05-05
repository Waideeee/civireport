from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.auditlog import AuditLog
from models.user import User
from schemas.auditlog import AuditLogCreate, AuditLogResponse
from security import require_internal_api_key
router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


def _format_timestamp(value):
    if not value:
        return ""
    return value.strftime("%Y-%m-%d %H:%M")

@router.get("/", response_model=list[AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db)):
    results = (
        db.query(
            AuditLog,
            func.coalesce(User.user_name, AuditLog.user_name).label("actor_name"),
            User.role.label("actor_role"),
        )
        .outerjoin(User, AuditLog.user_id == User.user_id)
        .order_by(AuditLog.audit_id.desc())
        .all()
    )
    return [
        {
            "audit_id":     audit.audit_id,
            "audit_date":   _format_timestamp(audit.audit_date or audit.created_at),
            "complaint_id": audit.complaint_id,
            "emergency_id": audit.emergency_id,
            "user_id":      audit.user_id if not audit.complaint_id and not audit.emergency_id else None,
            "old_status":   audit.old_status,
            "new_status":   audit.new_status,
            "action_notes": audit.action_notes,
            "admin_name":   actor_name or "System",
            "admin_role":   actor_role,
            "user_full_name": actor_name or "System",
            "user_role":    actor_role,
        }
        for audit, actor_name, actor_role in results
    ]

@router.post("/", dependencies=[Depends(require_internal_api_key)])
def create_audit_log(
    payload: AuditLogCreate,
    x_civireport_actor_id: str | None = Header(default=None, alias="X-CiviReport-Actor-Id"),
    db: Session = Depends(get_db),
):
    try:
        actor_id = int(x_civireport_actor_id) if x_civireport_actor_id else None
    except (ValueError, TypeError):
        actor_id = None

    derived_name = None
    if actor_id:
        user = db.query(User).filter(User.user_id == actor_id).first()
        derived_name = user.user_name if user else None

    log = AuditLog(
        complaint_id = payload.complaint_id,
        emergency_id = payload.emergency_id,
        old_status   = payload.old_status,
        new_status   = payload.new_status,
        action_notes = payload.action_notes,
        user_id      = actor_id,
        user_name    = derived_name,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return {"message": "Audit log created", "audit_id": log.audit_id}
