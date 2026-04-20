from pydantic import BaseModel
from typing import Optional
from datetime import date

class UserResponse(BaseModel):
    user_id: int
    user_name: str
    email: str
    gender: Optional[str]
    contact_num: Optional[str]
    address: Optional[str]
    date_registered: Optional[date]
    role: Optional[str]
    is_active: Optional[bool]
    approved_at: Optional[date]
    status: Optional[str]
    profile_photo_path: Optional[str] = None
    rejection_reason: Optional[str]

    class Config:
        from_attributes = True

class UserStatusUpdate(BaseModel):
    status: str
    rejection_reason: Optional[str] = None