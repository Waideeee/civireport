from fastapi import APIRouter, Depends
from sqlalchemy import String, cast, func
from sqlalchemy.orm import Session

from database import get_db
from models.complaint import Complaint
from models.user import User
from security import ADMIN_ROLES


router = APIRouter(prefix="/superadmin", tags=["SuperAdmin"])


def _admin_role_filter():
    return func.lower(cast(User.role, String)).in_(tuple(ADMIN_ROLES))


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
