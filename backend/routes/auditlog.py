from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.auditlog import AuditLog
from models.user import User
from schemas.auditlog import AuditLogResponse
router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

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
            "audit_date":   str(audit.created_at) if audit.created_at else "",
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

@router.post("/")
def create_audit_log(payload: dict, db: Session = Depends(get_db)):
    log = AuditLog(
        complaint_id = payload.get("complaint_id"),
        old_status   = payload.get("old_status"),
        new_status   = payload.get("new_status"),
        user_id      = payload.get("user_id") or payload.get("admin_id"),
        user_name    = payload.get("user_name"),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return {"message": "Audit log created", "audit_id": log.audit_id}
