from sqlalchemy import Column, Integer, String, TIMESTAMP
from database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    audit_id     = Column(Integer, primary_key=True, index=True)
    audit_date   = Column(TIMESTAMP)
    complaint_id = Column(Integer, nullable=True)
    emergency_id = Column(Integer, nullable=True)
    user_id      = Column(Integer, nullable=True)
    user_name    = Column(String(255), nullable=True)
    old_status   = Column(String(255))
    new_status   = Column(String(255))
    action_notes = Column(String(1000), nullable=True)
    created_at   = Column(TIMESTAMP)
    updated_at   = Column(TIMESTAMP)
