from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime


class ServiceFeedbackResponse(BaseModel):
    rating: int
    comment: Optional[str] = None
    submitted_at: Optional[str] = None

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

class ComplaintStatusUpdate(BaseModel):
    complaint_status: Literal["in_progress", "rejected"]
    admin_id: Optional[int] = None
    rejection_reason: Optional[str] = None
    action_proof: Optional[str] = None
    action_proof_name: Optional[str] = None
    resolved_notes: Optional[str] = None

class ComplaintRatingUpdate(BaseModel):
    service_rating: int
    resolved_notes: Optional[str] = None

class ComplaintResponse(ComplaintBase):
    complaint_id: int
    complaint_status: Optional[str] = None
    complaint_date: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    notified_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    resolved_media: Optional[str] = None
    resolved_notes: Optional[str] = None
    revision_feedback: Optional[str] = None
    resident_name: Optional[str] = None
    resident_email: Optional[str] = None
    resident_contact_num: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    contact_num: Optional[str] = None
    media: list[dict] = []
    history: list[dict] = []
    service_rating: Optional[int] = None
    service_feedback: Optional[ServiceFeedbackResponse] = None

    class Config:
        from_attributes = True
