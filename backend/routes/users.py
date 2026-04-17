from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.user import User
from schemas.user import UserResponse, UserStatusUpdate
from typing import List

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).filter(func.lower(User.role) != "admin").all()
    return users

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    return user

@router.patch("/{user_id}/status")
def update_user_status(user_id: int, payload: UserStatusUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        return {"error": "User not found"}
    user.status = payload.status
    if payload.status == "approved":
        from datetime import date
        user.approved_at = date.today()
        user.is_active = True
    elif payload.status == "rejected":
        user.is_active = False
        if payload.rejection_reason:
            user.rejection_reason = payload.rejection_reason
    db.commit()
    db.refresh(user)
    return {"message": "Status updated", "user_id": user_id, "status": user.status}