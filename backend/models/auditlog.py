from sqlalchemy import Column, Integer, String, TIMESTAMP
from database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    audit_id     = Column(Integer, primary_key=True, index=True)
    audit_date   = Column(TIMESTAMP)
    complaint_id = Column(Integer)
    old_status   = Column(String(255))
    new_status   = Column(String(255))
    admin_id     = Column(Integer)
    created_at   = Column(TIMESTAMP)
    updated_at   = Column(TIMESTAMP)