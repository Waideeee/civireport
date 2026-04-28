from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EmergencyBase(BaseModel):
    user_id: int
    address: str
    status: Optional[str] = "pending"
    notes: Optional[str] = None
    resolution_notes: Optional[str] = None

class EmergencyCreate(EmergencyBase):
    pass

class EmergencyResponse(EmergencyBase):
    emergency_id: int
    created_at: Optional[str] = None
    resolved_at: Optional[str] = None
    reporter_name: Optional[str] = None
    reporter_contact: Optional[str] = None
    user_name: Optional[str] = None
    contact_num: Optional[str] = None
    profile_photo_path: Optional[str] = None

    class Config:
        from_attributes = True

class EmergencyStatusUpdate(BaseModel):
    status: str
    admin_id: int
    notes: Optional[str] = None
