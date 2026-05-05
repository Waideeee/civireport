from fastapi import APIRouter, Depends
from sqlalchemy import func, or_, cast, String
from sqlalchemy.orm import Session
from database import get_db
from models.complaint import Complaint
from models.user import User
from datetime import datetime
from security import ADMIN_ROLES

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def _non_admin_role_expr():
    return or_(~func.lower(cast(User.role, String)).in_(tuple(ADMIN_ROLES)), User.role.is_(None))

@router.get("/complaints/latest")
def get_latest_complaint_notification(db: Session = Depends(get_db)):
    # Find all pending complaints that haven't been notified yet
    results = (
        db.query(Complaint, User)
        .join(User, Complaint.user_id == User.user_id)
        .filter(Complaint.notified_at.is_(None))
        .filter(Complaint.complaint_status == 'pending')
        .order_by(Complaint.created_at.desc())
        .all()
    )
    
    out = []
    for complaint, user in results:
        out.append({
            "complaint_id": complaint.complaint_id,
            "resident_name": user.user_name,
            "complaint_title": complaint.complaint_type,
            "created_at": str(complaint.created_at) if complaint.created_at else "",
            "profile_photo_path": getattr(user, "profile_photo_path", "")
        })
    return out

@router.get("/users/latest")
def get_latest_user_notification(db: Session = Depends(get_db)):
    # Find all pending users that haven't been notified yet
    users = (
        db.query(User)
        .filter(User.notified_at.is_(None))
        .filter(User.status == 'pending')
        .filter(_non_admin_role_expr())
        .order_by(User.date_registered.desc())
        .all()
    )
    
    out = []
    for user in users:
        out.append({
            "user_id": user.user_id,
            "full_name": user.user_name,
            "email": user.email,
            "date_registered": str(user.date_registered) if user.date_registered else "",
            "profile_photo_path": getattr(user, "profile_photo_path", "")
        })
    return out

@router.patch("/complaints/{id}/notified")
def mark_complaint_notified(id: int, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.complaint_id == id).first()
    if complaint:
        complaint.notified_at = datetime.utcnow()
        db.commit()
    return {"status": "success"}

@router.patch("/users/{id}/notified")
def mark_user_notified(id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == id).first()
    if user:
        user.notified_at = datetime.utcnow()
        db.commit()
    return {"status": "success"}
