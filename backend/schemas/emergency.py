from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EmergencyBase(BaseModel):
    user_id: int
    location: str
    status: Optional[str] = "pending"
    notes: Optional[str] = None
    resolution_notes: Optional[str] = None

class EmergencyCreate(EmergencyBase):
    pass

class EmergencyResponse(EmergencyBase):
    emergency_id: int
    created_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class EmergencyStatusUpdate(BaseModel):
    status: str
    admin_id: int
    notes: Optional[str] = None
