from sqlalchemy import Column, Integer, Text, TIMESTAMP, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class ServiceRating(Base):
    __tablename__ = "service_ratings"

    id           = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaint.complaint_id"))
    user_id      = Column(Integer, ForeignKey("users.user_id"))
    rating       = Column(Integer)
    feedback     = Column(Text, nullable=True)
    created_at   = Column(TIMESTAMP, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
    )

    complaint = relationship("Complaint", back_populates="service_rating_rel")
    user      = relationship("User")
