from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, cast, String
from database import get_db
from models.user import User
from models.complaint import Complaint
from models.auditlog import AuditLog
from security import ADMIN_ROLES

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _admin_role_expr():
    return func.lower(cast(User.role, String)).in_(tuple(ADMIN_ROLES))


def _non_admin_role_expr():
    return or_(~_admin_role_expr(), User.role.is_(None))


def _resident_role_expr():
    return func.lower(cast(User.role, String)) == "resident"

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    pending_count = db.query(func.count(User.user_id)).filter(
        _resident_role_expr(),
        func.lower(User.status) == "pending"
    ).scalar()

    registered_count = db.query(func.count(User.user_id)).filter(
        _resident_role_expr(),
    ).scalar()

    return {
        "pending_users": pending_count,
        "registered_users": registered_count,
    }

@router.get("/superadmin-stats")
def get_superadmin_stats(db: Session = Depends(get_db)):
    active_admins = db.query(func.count(User.user_id)).filter(
        _admin_role_expr(),
        or_(func.lower(cast(User.status, String)).in_(["active", "approved", "resolved"]), User.is_active == True)
    ).scalar()

    inactive_admins = db.query(func.count(User.user_id)).filter(
        _admin_role_expr(),
        or_(func.lower(cast(User.status, String)).in_(["deactivated", "inactive", "rejected"]), User.is_active == False)
    ).scalar()

    total_residents = db.query(func.count(User.user_id)).filter(
        func.lower(User.role) == "resident"
    ).scalar()

    total_complaints = db.query(func.count(Complaint.complaint_id)).scalar()

    return {
        "active_admins": active_admins,
        "inactive_admins": inactive_admins,
        "total_residents": total_residents,
        "total_complaints": total_complaints,
    }

@router.get("/complaint-stats")
def get_complaint_stats(db: Session = Depends(get_db)):
    pending     = db.query(func.count(Complaint.complaint_id)).filter(func.lower(cast(Complaint.complaint_status, String)) == "pending").scalar()
    in_progress = db.query(func.count(Complaint.complaint_id)).filter(func.lower(cast(Complaint.complaint_status, String)) == "in_progress").scalar()
    resolved    = db.query(func.count(Complaint.complaint_id)).filter(func.lower(cast(Complaint.complaint_status, String)) == "resolved").scalar()
    rejected    = db.query(func.count(Complaint.complaint_id)).filter(func.lower(cast(Complaint.complaint_status, String)) == "rejected").scalar()
    total       = db.query(func.count(Complaint.complaint_id)).scalar()

    return {
        "pending":     pending,
        "in_progress": in_progress,
        "resolved":    resolved,
        "rejected":    rejected,
        "total":       total,
    }
@router.get("/pending-users")
def get_pending_users(db: Session = Depends(get_db)):
    users = db.query(User).filter(
        _resident_role_expr(),
        func.lower(cast(User.status, String)) == "pending"
    ).order_by(User.date_registered.desc()).all()
    return [
        {
            "user_id":    u.user_id,
            "name":       u.user_name,
            "email":      u.email,
            "created_at": str(u.date_registered) if u.date_registered else ""
        }
        for u in users
    ]

@router.get("/registered-users")
def get_registered_users(db: Session = Depends(get_db)):
    users = db.query(User).filter(
        _resident_role_expr(),
    ).order_by(User.date_registered.desc(), User.user_id.desc()).limit(5).all()
    return [
        {
            "user_id": u.user_id,
            "name":    u.user_name,
            "address": u.address if u.address else "N/A",
            "status":  u.status or "resident"
        }
        for u in users
    ]

@router.get("/recent-activity")
def get_recent_activity(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.audit_date.desc()).limit(10).all()
    return [
        {
            "audit_id": log.audit_id,
            "audit_date": str(log.audit_date) if log.audit_date else None,
            "user_name": log.user_name,
            "action_notes": log.action_notes,
            "old_status": log.old_status,
            "new_status": log.new_status
        }
        for log in logs
    ]
