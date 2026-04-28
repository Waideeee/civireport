import secrets
from datetime import date, datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import String, cast, func
from sqlalchemy.orm import Session

from database import get_db
from mailer import send_barangay_admin_created_email
from models.user import User
from passwords import hash_password
from schemas.user import BarangayAdminCreate
from schema_alignment import ensure_user_verification_columns, sync_users_user_id_sequence


router = APIRouter(prefix="/api/admin", tags=["Admin Registration"])


def _verification_url(token: str) -> str:
    import os

    frontend_base_url = os.getenv("FRONTEND_URL", "http://localhost:8000")
    return f"{frontend_base_url.rstrip('/')}/verify-email/{token}"


@router.post("/register-barangay-admin", status_code=status.HTTP_201_CREATED)
def register_barangay_admin(
    payload: BarangayAdminCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    try:
        ensure_user_verification_columns()
        sync_users_user_id_sequence()

        existing_user = (
            db.query(User)
            .filter(func.lower(cast(User.email, String)) == payload.email.strip().lower())
            .first()
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered.",
            )

        token = secrets.token_urlsafe(32)
        token_expires = datetime.utcnow() + timedelta(hours=24)

        new_user = User(
            user_name=payload.full_name.strip(),
            email=payload.email.strip().lower(),
            password=hash_password(payload.password),
            role="barangay_admin",
            contact_num=payload.contact_number.strip(),
            date_registered=date.today(),
            approved_at=None,
            status="pending",
            is_active=False,
            is_verified=False,
            verified_at=None,
            email_verified_at=None,
            email_verification_token=token,
            email_verification_token_expires=token_expires,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        if new_user.email:
            background_tasks.add_task(
                send_barangay_admin_created_email,
                user_email=new_user.email,
                user_name=new_user.user_name,
                registered_email=new_user.email,
                verification_url=_verification_url(token),
            )

        return {
            "message": "Barangay admin created successfully. A verification email has been sent.",
            "user": {
                "user_id": new_user.user_id,
                "user_name": new_user.user_name,
                "email": new_user.email,
                "role": new_user.role,
                "contact_num": new_user.contact_num,
                "status": new_user.status,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Backend Error: {str(e)} | Trace: {traceback.format_exc()}"
        )
