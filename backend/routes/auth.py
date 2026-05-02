import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import String, cast, func
from sqlalchemy.orm import Session

from database import get_db
from mailer import send_barangay_admin_created_email
from models.user import User
from schemas.user import ResendVerificationRequest
from schema_alignment import ensure_user_verification_columns


router = APIRouter(prefix="/api/auth", tags=["Authentication"])

TOKEN_TTL_HOURS = 24


def _generate_verification_token() -> str:
    return secrets.token_urlsafe(32)


def _token_expiry() -> datetime:
    return datetime.utcnow() + timedelta(hours=TOKEN_TTL_HOURS)


def _verification_url(token: str) -> str:
    import os

    frontend_base_url = os.getenv("FRONTEND_URL", "http://localhost:8000")
    return f"{frontend_base_url.rstrip('/')}/verify-email/{token}"


def _queue_verification_email(
    background_tasks: BackgroundTasks,
    user: User,
):
    background_tasks.add_task(
        send_barangay_admin_created_email,
        user_email=user.email,
        user_name=user.user_name,
        registered_email=user.email,
        verification_url=_verification_url(user.email_verification_token),
    )


@router.get("/verify-email/{token}")
def verify_email_token(token: str, db: Session = Depends(get_db)):
    ensure_user_verification_columns()

    user = (
        db.query(User)
        .filter(User.email_verification_token == token)
        .first()
    )

    if (
        not user
        or not user.email_verification_token_expires
        or user.email_verification_token_expires < datetime.utcnow()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification link is invalid or has expired.",
        )

    now = datetime.utcnow()
    user.email_verified_at = now
    # Auto-approve on email verification: status -> "approved", is_active -> True.
    user.status = "approved"
    user.is_active = True
    if not user.approved_at:
        user.approved_at = now.date()
    user.email_verification_token = None
    user.email_verification_token_expires = None

    db.commit()

    return {
        "message": "Your email has been verified. You can now log in.",
        "email": user.email,
        "user_name": user.user_name,
    }


@router.post("/resend-verification")
def resend_verification_email(
    payload: ResendVerificationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    ensure_user_verification_columns()

    user = (
        db.query(User)
        .filter(func.lower(cast(User.email, String)) == payload.email.strip().lower())
        .first()
    )

    if not user or (user.role or "").lower() != "barangay_admin":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending Barangay Admin account was found for that email.",
        )

    if user.email_verified_at and (user.status or "").lower() in {"active", "approved"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email address is already verified.",
        )

    user.email_verification_token = _generate_verification_token()
    user.email_verification_token_expires = _token_expiry()
    user.status = "pending"
    user.is_active = False
    user.email_verified_at = None

    db.commit()
    db.refresh(user)

    _queue_verification_email(background_tasks, user)

    return {
        "message": "A new verification email has been sent.",
        "email": user.email,
    }
