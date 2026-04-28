from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, cast, String
from database import get_db
from models.user import User
from models.complaint import Complaint
from models.complaint_media import Complaint_media
from models.superadmin_auditlog import SuperAdminAuditLog
from typing import List
from security import ADMIN_ROLES

router = APIRouter(prefix="/superadmin", tags=["SuperAdmin"])


def _admin_role_filter():
    return func.lower(cast(User.role, String)).in_(tuple(ADMIN_ROLES))

@router.get("/stats")
def get_superadmin_stats(db: Session = Depends(get_db)):
    active_admins = db.query(func.count(User.user_id)).filter(
        _admin_role_filter(),
        User.is_active == True
    ).scalar()

    inactive_admins = db.query(func.count(User.user_id)).filter(
        _admin_role_filter(),
        User.is_active == False
    ).scalar()

    total_residents = db.query(func.count(User.user_id)).filter(
        func.lower(cast(User.role, String)) == "resident",
    ).scalar()

    total_complaints = db.query(func.count(Complaint.complaint_id)).scalar()

    return {
        "active_admins": active_admins,
        "inactive_admins": inactive_admins,
        "total_residents": total_residents,
        "total_complaints": total_complaints,
    }

@router.get("/audit-logs")
def get_superadmin_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(
        SuperAdminAuditLog,
        User.user_name.label("admin_name"),
        User.email.label("admin_email")
    ).join(User, SuperAdminAuditLog.admin_id == User.user_id)\
     .order_by(desc(SuperAdminAuditLog.created_at)).all()
    
    result = []
    for log, admin_name, admin_email in logs:
        target = db.query(User).filter(User.user_id == log.target_user_id).first()
        result.append({
            "id": log.id,
            "admin_name": admin_name,
            "target_name": target.user_name if target else "Unknown",
            "action": log.action,
            "created_at": log.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })
    return result

from pydantic import BaseModel

class LogCreate(BaseModel):
    admin_id: int
    target_user_id: int
    action: str

@router.post("/log")
def create_superadmin_log(payload: LogCreate, db: Session = Depends(get_db)):
    new_log = SuperAdminAuditLog(
        admin_id=payload.admin_id,
        target_user_id=payload.target_user_id,
        action=payload.action
    )
    db.add(new_log)
    db.commit()
    return {"message": "Log created"}
