from database import SessionLocal
from models.complaint import Complaint
from models.complaint_media import Complaint_media
from models.user import User

def check_complaint(cid):
    db = SessionLocal()
    try:
        c = db.query(Complaint).filter(Complaint.complaint_id == cid).first()
        if c:
            print(f"Complaint ID: {c.complaint_id}")
            print(f"Status: {c.complaint_status}")
            return c
        else:
            print(f"Complaint {cid} not found.")
            return None
    finally:
        db.close()

if __name__ == "__main__":
    check_complaint(6)
