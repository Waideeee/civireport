from sqlalchemy import Column, Integer, String, Text, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Complaint(Base):
    __tablename__ = "complaint"

    complaint_id       = Column(Integer, primary_key=True, index=True)
    complaint_date     = Column(TIMESTAMP)
    user_id            = Column(Integer)
    complaint_type     = Column(String(255))
    complaint_subtype  = Column(String(255))
    additional_notes   = Column(String(255))
    complaint_location = Column(String(500))
    complaint_status   = Column(String(50), default="pending")
    urgency_level      = Column(String(50))
    created_at         = Column(TIMESTAMP, server_default=func.now())
    updated_at         = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=True)
    rejection_reason   = Column(String(500))
    resolved_media     = Column(String(255))
    resolved_notes     = Column(String(255))
    notified_at        = Column(TIMESTAMP, nullable=True)
    ai_recommendation  = Column(Text, nullable=True)
    revision_feedback  = Column(Text, nullable=True)
    service_rating     = Column(Integer, nullable=True)

    complaint_media    = relationship("Complaint_media", back_populates="complaint")
    service_rating_rel = relationship("ServiceRating", back_populates="complaint", uselist=False)
