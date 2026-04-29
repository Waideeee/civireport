from datetime import datetime, date

from fastapi import APIRouter, Depends, BackgroundTasks, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, String
from database import get_db
from models.user import User
from models.auditlog import AuditLog
from routes.superadmin_auditlog import log_superadmin_audit
from schemas.user import UserResponse, UserStatusUpdate
from typing import List
from mailer import send_account_resolved_email, send_verification_email
from pydantic import BaseModel
from security import ADMIN_ROLES, require_admin_actor, require_superadmin_actor

class VerificationRequest(BaseModel):
    email: str
    name: str
    verification_url: str

class VerificationSuccessRequest(BaseModel):
    email: str
    name: str

router = APIRouter(prefix="/users", tags=["Users"])


def _admin_role_filter():
    return func.lower(cast(User.role, String)).in_(tuple(ADMIN_ROLES))


def _normalize_user_status(user: User) -> str:
    status_text = (user.status or "").strip().lower()
    if status_text in {"active", "approved", "resolved"} or bool(user.is_active):
        return "active"
    if status_text in {"inactive", "deactivated"} or user.is_active is False:
        return "inactive"
    return status_text or "pending"


def _is_barangay_admin(user: User) -> bool:
    return (user.role or "").strip().lower() in ADMIN_ROLES

@router.get("/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).filter(func.lower(cast(User.role, String)) == "resident").all()
    return users

@router.get("/pending-admins", response_model=List[UserResponse])
def get_pending_admins(db: Session = Depends(get_db)):
    return db.query(User).filter(
        _admin_role_filter(),
        User.status == "pending"
    ).all()

@router.get("/all-admins", response_model=List[UserResponse])
def get_all_admins(db: Session = Depends(get_db)):
    return db.query(User).filter(
        _admin_role_filter()
    ).order_by(User.date_registered.desc()).all()

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    return user

@router.patch("/{user_id}/status", dependencies=[Depends(require_admin_actor)])
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    x_civireport_actor_id: str | None = Header(default=None, alias="X-CiviReport-Actor-Id"),
    x_civireport_actor_role: str | None = Header(default=None, alias="X-CiviReport-Actor-Role"),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        return {"error": "User not found"}

    old_status = _normalize_user_status(user)
    user.status = payload.status
    if payload.status in {"approved", "active", "resolved"}:
        if not user.approved_at:
            user.approved_at = date.today()
        user.is_active = True
        
        # Send activation email for resident-style workflows only.
        if user.email and (user.role or "").lower() not in ADMIN_ROLES:
            background_tasks.add_task(
                send_account_resolved_email,
                user_email=user.email,
                user_name=user.user_name
            )
    elif payload.status in {"rejected", "deactivated", "inactive"}:
        user.is_active = False
        if payload.rejection_reason:
            user.rejection_reason = payload.rejection_reason

    actor_id = int(x_civireport_actor_id) if x_civireport_actor_id and x_civireport_actor_id.isdigit() else None
    actor = db.query(User).filter(User.user_id == actor_id).first() if actor_id else None
    actor_role = (x_civireport_actor_role or "").strip().lower()
    note_parts = [f"Resident account for {user.user_name} ({user.email}) {payload.status}."]
    if payload.rejection_reason:
        note_parts.append(f"Reason: {payload.rejection_reason}")

    now = datetime.utcnow()
    db.add(
        AuditLog(
            complaint_id=None,
            emergency_id=None,
            user_id=actor_id,
            user_name=actor.user_name if actor else "System",
            old_status=old_status,
            new_status=payload.status,
            action_notes=" ".join(note_parts),
            audit_date=now,
            created_at=now,
            updated_at=now,
        )
    )

    if actor_id and actor_role == "superadmin" and _is_barangay_admin(user):
        if payload.status in {"approved", "active", "resolved"}:
            action_notes = "Account activated"
        elif payload.status in {"deactivated", "inactive"}:
            action_notes = "Account deactivated"
        else:
            action_notes = f"Account status changed to {payload.status}"

        log_superadmin_audit(
            db,
            superadmin_id=actor_id,
            user_id=user.user_id,
            user_name=user.user_name,
            action_notes=action_notes,
            old_status=old_status,
            new_status=_normalize_user_status(user),
            audit_date=now,
        )

    db.commit()
    db.refresh(user)
    return {"message": "Status updated", "user_id": user_id, "status": user.status}


@router.delete("/{user_id}", dependencies=[Depends(require_superadmin_actor)])
def delete_barangay_admin(
    user_id: int,
    db: Session = Depends(get_db),
    x_civireport_actor_id: str | None = Header(default=None, alias="X-CiviReport-Actor-Id"),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        return {"error": "User not found"}

    if not _is_barangay_admin(user):
        return {"error": "Only barangay admin accounts can be deleted from this endpoint."}

    actor_id = int(x_civireport_actor_id) if x_civireport_actor_id and x_civireport_actor_id.isdigit() else None
    if actor_id is None:
        return {"error": "Missing superadmin actor."}

    now = datetime.utcnow()
    old_status = _normalize_user_status(user)
    deleted_user_id = user.user_id
    deleted_user_name = user.user_name

    log_superadmin_audit(
        db,
        superadmin_id=actor_id,
        user_id=deleted_user_id,
        user_name=deleted_user_name,
        action_notes="Deleted Barangay Admin account",
        old_status=old_status,
        new_status="deleted",
        audit_date=now,
    )
    db.delete(user)
    db.commit()
    return {"message": "Barangay admin deleted.", "user_id": deleted_user_id}

@router.post("/send-verification")
async def trigger_verification_email(payload: VerificationRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(
        send_verification_email,
        user_email=payload.email,
        user_name=payload.name,
        verification_url=payload.verification_url
    )
    return {"message": "Verification email queued"}

@router.post("/send-verification-success")
async def trigger_verification_success_email(payload: VerificationSuccessRequest, background_tasks: BackgroundTasks):
    from mailer import send_verification_success_email
    background_tasks.add_task(
        send_verification_success_email,
        user_email=payload.email,
        user_name=payload.name
    )
    return {"message": "Verification success email queued"}
