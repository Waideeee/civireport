from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.auditlog import AuditLog
from models.user import User

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("/")
def get_audit_logs(db: Session = Depends(get_db)):
    results = (
        db.query(AuditLog, User)
        .join(User, AuditLog.admin_id == User.user_id)
        .order_by(AuditLog.audit_id.desc())
        .all()
    )
    return [
        {
            "audit_id":     a.audit_id,
            "audit_date":   str(a.created_at) if a.created_at else "",
            "complaint_id": a.complaint_id,
            "emergency_id": a.emergency_id,
            "old_status":   a.old_status,
            "new_status":   a.new_status,
            "action_notes": a.action_notes,
            "admin_name":   u.user_name,
        }
        for a, u in results
    ]

@router.post("/")
def create_audit_log(payload: dict, db: Session = Depends(get_db)):
    log = AuditLog(
        complaint_id = payload.get("complaint_id"),
        old_status   = payload.get("old_status"),
        new_status   = payload.get("new_status"),
        admin_id     = payload.get("admin_id"),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return {"message": "Audit log created", "audit_id": log.audit_id}