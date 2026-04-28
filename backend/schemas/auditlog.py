from typing import Optional

from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    audit_id: int
    audit_date: Optional[str] = None
    complaint_id: Optional[int] = None
    emergency_id: Optional[int] = None
    user_id: Optional[int] = None
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    action_notes: Optional[str] = None
    admin_name: Optional[str] = None
    admin_role: Optional[str] = None
    user_full_name: Optional[str] = None
    user_role: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
