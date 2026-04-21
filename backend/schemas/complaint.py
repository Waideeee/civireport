from pydantic import BaseModel
from typing import Optional
from datetime import date

class ComplaintBase(BaseModel):
    user_id: int
    complaint_type: str
    complaint_subtype: str
    complaint_location: str
    urgency_level: str
    additional_notes: Optional[str] = None
    ai_recommendation: Optional[str] = None

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintResponse(ComplaintBase):
    complaint_id: int
    complaint_status: Optional[str] = None
    complaint_date: Optional[date] = None

    class Config:
        from_attributes = True
