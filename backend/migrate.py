from database import engine, Base
from sqlalchemy import text
from models.user import User
from models.complaint import Complaint
from models.complaint_media import Complaint_media
from models.announcement import Announcement
from models.emergency import Emergency

# 1. Create any missing tables (like complaint_media)
Base.metadata.create_all(bind=engine)

# 2. Add the rejection_reason column to users if it doesn't exist
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN rejection_reason VARCHAR(500);"))
        conn.commit()
        print("Successfully added rejection_reason column.")
    except Exception as e:
        if "Duplicate column name" in str(e) or "already exists" in str(e).lower():
            print("Column rejection_reason already exists.")
        else:
            print("Could not add column (it might already exist or there was another error):", e)

# 3. Add the rejection_reason column to complaint if it doesn't exist
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE complaint ADD COLUMN rejection_reason VARCHAR(500);"))
        conn.commit()
        print("Successfully added rejection_reason column to complaint.")
    except Exception as e:
        if "Duplicate column name" in str(e) or "already exists" in str(e).lower() or "Duplicate column" in str(e):
            print("Column rejection_reason already exists in complaint.")
        else:
            print("Could not add column to complaint:", e)
