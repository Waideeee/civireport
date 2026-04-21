from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.complaint import Complaint
from models.user import User
from datetime import datetime

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/test_generate")
def test_generate(db: Session = Depends(get_db)):
    try:
        import time
        timestamp = int(time.time())
        new_user = User(
            user_name=f"Test Resident {timestamp}",
            email=f"test_{timestamp}@example.com",
            password="dummy_password",
            contact_num="1234567890",
            status="pending",
            role="resident",
            date_registered=datetime.utcnow()
        )
        db.add(new_user)
        db.commit()
        
        new_complaint = Complaint(
            user_id=new_user.user_id,
            complaint_type="Noise Disturbance",
            complaint_status="pending",
            created_at=datetime.utcnow()
        )
        db.add(new_complaint)
        db.commit()
        return {"status": "success", "msg": "Generated test data!"}
    except Exception as e:
        return {"status": "error", "msg": str(e)}

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
