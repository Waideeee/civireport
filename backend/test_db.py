from database import get_db
from models.user import User
from models.complaint import Complaint

db = next(get_db())
try:
    users = db.query(User).all()
    print("Users loaded:", len(users))
except Exception as e:
    print("User fetch error:", e)

try:
    from sqlalchemy.orm import joinedload
    complaints = db.query(Complaint).options(joinedload(Complaint.complaint_media)).all()
    print("Complaints loaded:", len(complaints))
except Exception as e:
    print("Complaint fetch error:", e)
