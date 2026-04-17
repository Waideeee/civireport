from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.user import User
from models.complaint import Complaint

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    pending_count = db.query(func.count(User.user_id)).filter(
        func.lower(User.role) != "admin",
        func.lower(User.status) == "pending"
    ).scalar()

    registered_count = db.query(func.count(User.user_id)).filter(
        func.lower(User.role) != "admin",
        func.lower(User.status) == "approved"
    ).scalar()

    return {
        "pending_users": pending_count,
        "registered_users": registered_count,
    }

@router.get("/complaint-stats")
def get_complaint_stats(db: Session = Depends(get_db)):
    pending     = db.query(func.count(Complaint.complaint_id)).filter(func.lower(Complaint.complaint_status) == "pending").scalar()
    in_progress = db.query(func.count(Complaint.complaint_id)).filter(func.lower(Complaint.complaint_status) == "in progress").scalar()
    resolved    = db.query(func.count(Complaint.complaint_id)).filter(func.lower(Complaint.complaint_status) == "resolved").scalar()
    rejected    = db.query(func.count(Complaint.complaint_id)).filter(func.lower(Complaint.complaint_status) == "rejected").scalar()
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
        func.lower(User.role) != "admin",
        func.lower(User.status) == "pending"
    ).limit(5).all()
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
        func.lower(User.role) != "admin",
        func.lower(User.status) == "approved"
    ).limit(5).all()
    return [
        {
            "user_id": u.user_id,
            "name":    u.user_name,
            "address": u.address if u.address else "N/A",
            "status":  u.status
        }
        for u in users
    ]
    