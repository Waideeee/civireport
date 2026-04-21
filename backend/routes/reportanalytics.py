from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.complaint import Complaint
from analytics_snapshot import build_analytics_snapshot
from openai_insights import generate_analytics_insight

router = APIRouter(prefix="/analytics", tags=["Analytics"])

def _load_analytics_snapshot(db: Session):
    rows = (
        db.query(
            Complaint.complaint_id,
            Complaint.complaint_date,
            Complaint.complaint_type,
            Complaint.complaint_subtype,
            Complaint.complaint_location,
            Complaint.complaint_status,
            Complaint.urgency_level,
            Complaint.created_at,
        )
        .all()
    )

    records = [
        {
            "complaint_id": row.complaint_id,
            "complaint_date": row.complaint_date,
            "complaint_type": row.complaint_type,
            "complaint_subtype": row.complaint_subtype,
            "complaint_location": row.complaint_location,
            "complaint_status": row.complaint_status,
            "urgency_level": row.urgency_level,
            "created_at": row.created_at,
        }
        for row in rows
    ]
    return build_analytics_snapshot(records)


@router.get("/")
def get_analytics(db: Session = Depends(get_db)):
    snapshot = _load_analytics_snapshot(db)
    return {
        "summary": snapshot["summary"],
        "by_category": snapshot["by_category"],
        "by_status": snapshot["by_status"],
        "monthly": snapshot["monthly"],
    }


@router.get("/insight")
def get_analytics_insight(db: Session = Depends(get_db)):
    snapshot = _load_analytics_snapshot(db)
    return generate_analytics_insight(snapshot)
