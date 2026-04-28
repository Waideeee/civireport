from fastapi import Depends, FastAPI
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
from routes.superadmin import router as superadmin_router
from routes.admin_registration import router as admin_registration_router
from routes.auth import router as auth_router
from database import get_db
from models.user import User
from models.complaint import Complaint
from models.complaint_media import Complaint_media
from models.announcement import Announcement
from models.emergency import Emergency
from models.service_rating import ServiceRating
from security import require_admin_actor, require_internal_api_key, require_superadmin_actor
from schema_alignment import ensure_user_verification_columns, sync_users_user_id_sequence, auto_resolve_rated_complaints

app = FastAPI(title="CiviReport API")

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

app.include_router(users_router, dependencies=[Depends(require_internal_api_key)])
app.include_router(
    dashboard_router,
    dependencies=[Depends(require_internal_api_key), Depends(require_admin_actor)],
)
app.include_router(
    complaints_router,
    dependencies=[Depends(require_internal_api_key)],
)
app.include_router(
    auditlogs_router,
    dependencies=[Depends(require_internal_api_key), Depends(require_admin_actor)],
)
app.include_router(
    reportanalytics_router,
    dependencies=[Depends(require_internal_api_key), Depends(require_admin_actor)],
)
app.include_router(
    announcement_router,
    dependencies=[Depends(require_internal_api_key), Depends(require_admin_actor)],
)
app.include_router(
    emergencies_router,
    dependencies=[Depends(require_internal_api_key), Depends(require_admin_actor)],
)
app.include_router(
    notifications_router,
    dependencies=[Depends(require_internal_api_key), Depends(require_admin_actor)],
)
app.include_router(
    superadmin_router,
    dependencies=[Depends(require_internal_api_key), Depends(require_superadmin_actor)],
)
app.include_router(
    admin_registration_router,
    dependencies=[Depends(require_internal_api_key), Depends(require_superadmin_actor)],
)
app.include_router(
    auth_router,
    dependencies=[Depends(require_internal_api_key)],
)

from scheduler import start_scheduler, stop_scheduler

@app.on_event("startup")
def startup_event():
    try:
        ensure_user_verification_columns()
        sync_users_user_id_sequence()
        auto_resolve_rated_complaints()
    except Exception as exc:
        print(f"Startup schema alignment error: {exc}")
    start_scheduler()


@app.on_event("shutdown")
def shutdown_event():
    stop_scheduler()

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def root():
    return {"message": "CiviReport FastAPI is running!"}

@app.get("/test", dependencies=[Depends(require_internal_api_key)])
def test():
    db = next(get_db())
    users = db.query(User).all()
    return {"count": len(users), "users": [u.user_name for u in users]}
