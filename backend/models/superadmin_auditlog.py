from sqlalchemy import Column, ForeignKey, Integer, String, Text, TIMESTAMP
from sqlalchemy.sql import func
from database import Base


class SuperAdminAuditLog(Base):
    __tablename__ = "superadmin_audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    # Legacy columns retained for backward compatibility with existing rows.
    admin_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    target_user_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    action = Column(String(50), nullable=True)

    superadmin_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    audit_date = Column(TIMESTAMP, server_default=func.now(), nullable=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    user_name = Column(String(255), nullable=True)
    action_notes = Column(Text, nullable=True)
    old_status = Column(String(100), nullable=True)
    new_status = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
