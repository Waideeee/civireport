from sqlalchemy import Column, Integer, String, Text, TIMESTAMP
from sqlalchemy.sql import func
from database import Base

class Emergency(Base):
    __tablename__ = "emergencies"

    emergency_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    address = Column(String(500))
    status = Column(String(50), default="pending") # pending, acknowledged, resolved
    created_at = Column(TIMESTAMP, server_default=func.now())
    resolved_at = Column(TIMESTAMP, nullable=True)
    notes = Column(Text, nullable=True) # Acknowledge notes
    resolution_notes = Column(Text, nullable=True) # Resolved/False Alarm notes
