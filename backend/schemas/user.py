from typing import Optional

from datetime import datetime

from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field

class UserResponse(BaseModel):
    user_id: int
    user_name: str
    email: str
    gender: Optional[str]
    contact_num: Optional[str]
    address: Optional[str]
    barangay: Optional[str] = None
    date_registered: Optional[datetime]
    role: Optional[str]
    is_active: Optional[bool]
    approved_at: Optional[datetime]
    status: Optional[str]
    profile_photo_path: Optional[str] = None
    profile_photo_url: Optional[str] = None
    rejection_reason: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class UserStatusUpdate(BaseModel):
    status: str
    rejection_reason: Optional[str] = None


class BarangayAdminCreate(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=255,
        validation_alias=AliasChoices("full_name", "user_name"),
    )
    email: EmailStr
    password: str = Field(min_length=8, max_length=255)
    contact_number: str = Field(
        min_length=7,
        max_length=50,
        validation_alias=AliasChoices("contact_number", "contact_num"),
    )
    gender: str = Field(min_length=1, max_length=50)
    address: str = Field(min_length=5, max_length=500)


class ResendVerificationRequest(BaseModel):
    email: EmailStr
