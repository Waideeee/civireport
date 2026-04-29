from pydantic import BaseModel
from typing import Optional


class SuperAdminAuditLogCreate(BaseModel):
    superadmin_id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    action_notes: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None


class SuperAdminAuditLogRecord(BaseModel):
    id: int
    superadmin_id: Optional[int] = None
    superadmin_name: str
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    action_notes: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    audit_date: Optional[str] = None
    created_at: Optional[str] = None


class SuperAdminAuditLogListResponse(BaseModel):
    data: list[SuperAdminAuditLogRecord]
    total: int
    page: int
    per_page: int
