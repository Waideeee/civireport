from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models.complaint import Complaint
from models.user import User
from models.auditlog import AuditLog
from datetime import datetime

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def complaint_to_dict(c, u):
    media_list = []
    if getattr(c, "complaint_media", None):
        for m in c.complaint_media:
            media_list.append({
                "media_id": m.media_id,
                "file_path": m.file_path,
                "media_type": m.media_type
            })
            
    return {
        "complaint_id":       c.complaint_id,
        "complaint_date":     str(c.complaint_date) if c.complaint_date else "",
        "complaint_type":     c.complaint_type,
        "complaint_subtype":  c.complaint_subtype,
        "complaint_location": c.complaint_location,
        "complaint_status":   c.complaint_status,
        "urgency_level":      c.urgency_level,
        "additional_notes":   c.additional_notes,
        "created_at":         str(c.created_at) if c.created_at else "",
        "user_id":            c.user_id,
        "user_name":          u.user_name,
        "contact_num":        u.contact_num,
        "media":              media_list,
    }

@router.get("/")
def get_complaints(db: Session = Depends(get_db)):
    results = (
        db.query(Complaint, User)
        .join(User, Complaint.user_id == User.user_id)
        .options(joinedload(Complaint.complaint_media))
        .all()
    )
    return [complaint_to_dict(c, u) for c, u in results]

@router.get("/{complaint_id}")
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    result = (
        db.query(Complaint, User)
        .join(User, Complaint.user_id == User.user_id)
        .options(joinedload(Complaint.complaint_media))
        .filter(Complaint.complaint_id == complaint_id)
        .first()
    )
    if not result:
        return {"error": "Complaint not found"}
    c, u = result
    return complaint_to_dict(c, u)

@router.patch("/{complaint_id}/status")
def update_complaint_status(complaint_id: int, payload: dict, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()
    if not complaint:
        return {"error": "Complaint not found"}

    old_status = complaint.complaint_status or "Pending"
    complaint.complaint_status = payload.get("complaint_status")

    # FIX: set audit_date and created_at timestamps
    now = datetime.utcnow()
    log = AuditLog(
        complaint_id = complaint_id,
        old_status   = old_status,
        new_status   = complaint.complaint_status,
        admin_id     = payload.get("admin_id"),
        audit_date   = now,
        created_at   = now,
        updated_at   = now,
    )
    db.add(log)
    db.commit()
    db.refresh(complaint)
    return {"message": "Status updated", "complaint_id": complaint_id, "status": complaint.complaint_status}