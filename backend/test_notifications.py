from database import SessionLocal
from models.user import User
from models.complaint import Complaint
from models.complaint_media import Complaint_media
from datetime import datetime, date

from sqlalchemy import text

db = SessionLocal()

db.execute(text("SELECT setval('users_user_id_seq', (SELECT COALESCE(MAX(user_id), 1) FROM users))"))
db.execute(text("SELECT setval('complaint_complaint_id_seq', (SELECT COALESCE(MAX(complaint_id), 1) FROM complaint))"))
db.commit()

# 1. Create a dummy pending user
test_user = User(
    user_name="John Doe",
    email="new_resident2@example.com",
    gender="Male",
    contact_num="09998887777",
    address="123 Test Avenue, Block 5",
    password="password123",
    date_registered=date.today(),
    role="resident",
    is_active=True,
    status="pending"
)
db.add(test_user)
db.commit()
db.refresh(test_user)
print(f"Created pending user ID: {test_user.user_id}")

# 2. Create a dummy pending complaint
test_complaint = Complaint(
    complaint_date=date.today(),
    user_id=test_user.user_id,
    complaint_type="Noise Disturbance",
    complaint_subtype="Loud Music",
    additional_notes="Neighbor playing very loud music at 3 AM.",
    complaint_location="123 Test Avenue, Block 5",
    complaint_status="pending",
    urgency_level="Medium",
    created_at=datetime.utcnow()
)
db.add(test_complaint)
db.commit()
print("Created pending complaint.")
db.close()
