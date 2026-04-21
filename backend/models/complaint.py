from sqlalchemy import Column, Integer, String, Date, Text, TIMESTAMP
from sqlalchemy.orm import relationship
from database import Base

class Complaint(Base):
    __tablename__ = "complaint"

    complaint_id       = Column(Integer, primary_key=True, index=True)
    complaint_date     = Column(Date)
    user_id            = Column(Integer)
    complaint_type     = Column(String(255))
    complaint_subtype  = Column(String(255))
    additional_notes   = Column(Text)
    complaint_location = Column(String(500))
    complaint_status   = Column(String(255))
    urgency_level      = Column(String(50))
    created_at         = Column(TIMESTAMP)
    rejection_reason   = Column(Text)
    resolved_media     = Column(String(255))
    resolved_notes     = Column(Text)
    notified_at        = Column(TIMESTAMP, nullable=True)
    ai_recommendation  = Column(Text, nullable=True)

    complaint_media    = relationship("Complaint_media", back_populates="complaint")