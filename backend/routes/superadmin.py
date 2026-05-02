from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import String, cast, func
from sqlalchemy.orm import Session

from database import get_db
from models.complaint import Complaint
from models.user import User
from routes.superadmin_auditlog import log_superadmin_audit
from schemas.superadmin import DeactivateAdminRequest
from security import ADMIN_ROLES
from security import require_superadmin_actor


router = APIRouter(prefix="/api/superadmin", tags=["SuperAdmin"])


def _admin_role_filter():
    return func.lower(cast(User.role, String)).in_(tuple(ADMIN_ROLES))


def _normalize_admin_status(user: User) -> str:
    """Returns canonical status: approved, deactivated, rejected, or pending."""
    status_text = (user.status or "").strip().lower()
    if status_text in {"approved", "active", "resolved"} or bool(user.is_active):
        return "approved"
    if status_text in {"deactivated", "inactive"} or user.is_active is False:
        return "deactivated"
    if status_text == "rejected":
        return "rejected"
    return status_text or "pending"


@router.get("/stats")
def get_superadmin_stats(db: Session = Depends(get_db)):
    active_admins = db.query(func.count(User.user_id)).filter(
        _admin_role_filter(),
        User.is_active == True,
    ).scalar()

    inactive_admins = db.query(func.count(User.user_id)).filter(
        _admin_role_filter(),
        User.is_active == False,
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


@router.patch("/admins/{user_id}/deactivate", dependencies=[Depends(require_superadmin_actor)])
def deactivate_admin_account(
    user_id: int,
    payload: DeactivateAdminRequest,
    db: Session = Depends(get_db),
    x_civireport_actor_id: str | None = Header(default=None, alias="X-CiviReport-Actor-Id"),
):
    actor_id = int(x_civireport_actor_id) if x_civireport_actor_id and x_civireport_actor_id.isdigit() else payload.deactivated_by
    if actor_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing superadmin actor.",
        )

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin user not found.")

    role_name = (user.role or "").strip().lower()
    if role_name not in ADMIN_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only barangay admin accounts can be deactivated from this endpoint.",
        )

    old_status = _normalize_admin_status(user)
    now = datetime.utcnow()

    user.is_active = False
    user.status = "deactivated"

    log_superadmin_audit(
        db,
        superadmin_id=actor_id,
        user_id=user.user_id,
        user_name=user.user_name,
        action="Account deactivated",
        action_notes=payload.reason.strip(),
        old_status=old_status,
        new_status="deactivated",
        audit_date=now,
    )

    db.commit()
    db.refresh(user)

    return {
        "message": "Admin account has been deactivated successfully.",
        "user_id": user.user_id,
        "status": user.status,
        "is_active": user.is_active,
    }
