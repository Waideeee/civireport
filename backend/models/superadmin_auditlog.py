from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from database import Base

class SuperAdminAuditLog(Base):
    __tablename__ = "superadmin_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer)  # Super Admin ID
    target_user_id = Column(Integer)  # Affected Barangay Admin ID
    action = Column(String(50))  # approved / rejected / deactivated / reactivated
    created_at = Column(TIMESTAMP, server_default=func.now())
