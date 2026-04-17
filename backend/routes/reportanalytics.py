from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from database import get_db
from models.complaint import Complaint

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/")
def get_analytics(db: Session = Depends(get_db)):

    total      = db.query(func.count(Complaint.complaint_id)).scalar()
    resolved   = db.query(func.count(Complaint.complaint_id)).filter(func.lower(Complaint.complaint_status) == "resolved").scalar()
    pending    = db.query(func.count(Complaint.complaint_id)).filter(func.lower(Complaint.complaint_status) == "pending").scalar()
    in_progress = db.query(func.count(Complaint.complaint_id)).filter(func.lower(Complaint.complaint_status) == "in progress").scalar()
    rejected   = db.query(func.count(Complaint.complaint_id)).filter(func.lower(Complaint.complaint_status) == "rejected").scalar()

    by_category = (
        db.query(Complaint.complaint_type, func.count(Complaint.complaint_id))
        .group_by(Complaint.complaint_type)
        .all()
    )

    by_status = (
        db.query(Complaint.complaint_status, func.count(Complaint.complaint_id))
        .group_by(Complaint.complaint_status)
        .all()
    )

    monthly = (
        db.query(
            extract('month', Complaint.complaint_date).label('month'),
            extract('year', Complaint.complaint_date).label('year'),
            func.count(Complaint.complaint_id)
        )
        .filter(Complaint.complaint_date != None)
        .group_by('year', 'month')
        .order_by('year', 'month')
        .limit(7)
        .all()
    )

    month_names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

    return {
        "summary": {
            "total":       total,
            "resolved":    resolved,
            "pending":     pending,
            "in_progress": in_progress,
            "rejected":    rejected,
        },
        "by_category": {
            "labels": [r[0] or "Unknown" for r in by_category],
            "values": [r[1] for r in by_category],
        },
        "by_status": {
            "labels": [r[0] or "Unknown" for r in by_status],
            "values": [r[1] for r in by_status],
        },
        "monthly": {
            "labels": [month_names[int(r[1]) - 1] for r in monthly],
            "values": [r[2] for r in monthly],
        },
    }