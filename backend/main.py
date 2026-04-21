from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import datetime
from fastapi.encoders import ENCODERS_BY_TYPE

# Globally format all datetime objects to standard YYYY-MM-DD HH:MM:SS string
ENCODERS_BY_TYPE[datetime.datetime] = lambda dt: dt.strftime("%Y-%m-%d %H:%M:%S")

from routes.users import router as users_router
from routes.dashboard import router as dashboard_router
from routes.complaint import router as complaints_router
from routes.auditlog import router as auditlogs_router
from routes.reportanalytics import router as reportanalytics_router
from routes.announcement import router as announcement_router
from routes.emergencies import router as emergencies_router
from routes.notifications import router as notifications_router
from database import engine, get_db
from models.user import User
from models.complaint import Complaint
from models.complaint_media import Complaint_media
from models.announcement import Announcement
from models.emergency import Emergency

app = FastAPI(title="CiviReport API")

from sqlalchemy import text
from database import engine
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP NULL;"))
        conn.execute(text("ALTER TABLE complaint ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP NULL;"))
        conn.commit()
except Exception as e:
    print(f"Migration error: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://localhost:8001",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:8001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(dashboard_router)
app.include_router(complaints_router)
app.include_router(auditlogs_router)
app.include_router(reportanalytics_router)
app.include_router(announcement_router)
app.include_router(emergencies_router)
app.include_router(notifications_router)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def root():
    return {"message": "CiviReport FastAPI is running!"}

@app.get("/test")
def test():
    db = next(get_db())
    users = db.query(User).all()
    return {"count": len(users), "users": [u.user_name for u in users]}