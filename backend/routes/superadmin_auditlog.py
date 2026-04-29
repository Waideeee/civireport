from datetime import date, datetime, time
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import String, cast, desc, func
from sqlalchemy.orm import Session

from database import get_db
from models.superadmin_auditlog import SuperAdminAuditLog
from models.user import User
from schemas.superadmin_auditlog import (
    SuperAdminAuditLogCreate,
    SuperAdminAuditLogListResponse,
    SuperAdminAuditLogRecord,
)


router = APIRouter(prefix="/api/superadmin/audit-logs", tags=["SuperAdmin Audit Logs"])


def _normalize_status(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None

    text = value.strip()
    if not text:
        return None

    lowered = text.lower()
    if lowered in {"approved", "active", "reactivated", "resolved"}:
        return "active"
    if lowered in {"inactive", "deactivated"}:
        return "inactive"
    return lowered


def _legacy_status_from_action(action: Optional[str]) -> Optional[str]:
    return _normalize_status(action)


def _legacy_action_note(action: Optional[str]) -> str:
    normalized = _normalize_status(action)
    if normalized == "active":
        return "Account activated"
    if normalized == "inactive":
        return "Account deactivated"
    if normalized == "deleted":
        return "Deleted Barangay Admin account"
    if normalized == "pending":
        return "Created Barangay Admin account"
    return (action or "Superadmin action").strip() or "Superadmin action"


def _format_timestamp(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    return value.strftime("%Y-%m-%d %H:%M:%S")


def _parse_date_boundary(value: Optional[str], boundary: str) -> Optional[datetime]:
    if value is None:
        return None

    raw = value.strip()
    if not raw:
        return None

    try:
        parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return parsed.replace(tzinfo=None)
    except ValueError:
        pass

    try:
        parsed_date = date.fromisoformat(raw)
    except ValueError:
        return None

    return datetime.combine(parsed_date, time.min if boundary == "start" else time.max)


def log_superadmin_audit(
    db: Session,
    *,
    superadmin_id: int,
    user_id: Optional[int],
    user_name: Optional[str],
    action_notes: str,
    old_status: Optional[str] = None,
    new_status: Optional[str] = None,
    audit_date: Optional[datetime] = None,
) -> SuperAdminAuditLog:
    now = audit_date or datetime.utcnow()
    normalized_new_status = _normalize_status(new_status)
    normalized_old_status = _normalize_status(old_status)
    cleaned_user_name = (user_name or "").strip() or None

    if cleaned_user_name is None and user_id is not None:
        target = db.query(User).filter(User.user_id == user_id).first()
        cleaned_user_name = target.user_name if target else None

    legacy_action = normalized_new_status or (action_notes.strip()[:50] if action_notes.strip() else None)

    record = SuperAdminAuditLog(
        admin_id=superadmin_id,
        target_user_id=user_id,
        action=legacy_action,
        superadmin_id=superadmin_id,
        audit_date=now,
        user_id=user_id,
        user_name=cleaned_user_name,
        action_notes=action_notes.strip(),
        old_status=normalized_old_status,
        new_status=normalized_new_status,
        created_at=now,
    )
    db.add(record)
    return record


def _serialize_record(row: SuperAdminAuditLog, superadmin_names: dict[int, str], affected_names: dict[int, str]) -> SuperAdminAuditLogRecord:
    superadmin_id = row.superadmin_id or row.admin_id
    affected_user_id = row.user_id or row.target_user_id
    new_status = row.new_status or _legacy_status_from_action(row.action)
    action_notes = (row.action_notes or "").strip() or _legacy_action_note(row.action)
    affected_user_name = (row.user_name or "").strip() or affected_names.get(affected_user_id or -1)

    return SuperAdminAuditLogRecord(
        id=row.id,
        superadmin_id=superadmin_id,
        superadmin_name=superadmin_names.get(superadmin_id or -1, "Unknown"),
        user_id=affected_user_id,
        user_name=affected_user_name,
        action_notes=action_notes,
        old_status=row.old_status,
        new_status=new_status,
        audit_date=_format_timestamp(row.audit_date or row.created_at),
        created_at=_format_timestamp(row.created_at or row.audit_date),
    )


@router.get("/", response_model=SuperAdminAuditLogListResponse)
def get_superadmin_audit_logs(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    date_from: Optional[str] = Query(default=None),
    date_to: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    audit_date_expr = func.coalesce(SuperAdminAuditLog.audit_date, SuperAdminAuditLog.created_at)
    action_notes_expr = func.coalesce(SuperAdminAuditLog.action_notes, SuperAdminAuditLog.action)
    new_status_expr = func.coalesce(SuperAdminAuditLog.new_status, SuperAdminAuditLog.action)

    query = db.query(SuperAdminAuditLog)

    if search and search.strip():
        keyword = f"%{search.strip()}%"
        query = query.filter(action_notes_expr.ilike(keyword))

    normalized_status = _normalize_status(status)
    if normalized_status:
        query = query.filter(func.lower(cast(new_status_expr, String)) == normalized_status)

    parsed_from = _parse_date_boundary(date_from, "start")
    if parsed_from is not None:
        query = query.filter(audit_date_expr >= parsed_from)

    parsed_to = _parse_date_boundary(date_to, "end")
    if parsed_to is not None:
        query = query.filter(audit_date_expr <= parsed_to)

    total = query.count()
    rows = (
        query.order_by(desc(audit_date_expr), desc(SuperAdminAuditLog.id))
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    superadmin_ids = {row.superadmin_id or row.admin_id for row in rows if row.superadmin_id or row.admin_id}
    affected_user_ids = {row.user_id or row.target_user_id for row in rows if row.user_id or row.target_user_id}
    user_ids = superadmin_ids | affected_user_ids

    users = db.query(User.user_id, User.user_name).filter(User.user_id.in_(user_ids)).all() if user_ids else []
    name_map = {user_id: user_name for user_id, user_name in users}

    data = [_serialize_record(row, name_map, name_map) for row in rows]
    return SuperAdminAuditLogListResponse(data=data, total=total, page=page, per_page=per_page)


@router.post("/", response_model=SuperAdminAuditLogRecord)
def create_superadmin_audit_log(
    payload: SuperAdminAuditLogCreate,
    db: Session = Depends(get_db),
):
    record = log_superadmin_audit(
        db,
        superadmin_id=payload.superadmin_id,
        user_id=payload.user_id,
        user_name=payload.user_name,
        action_notes=payload.action_notes,
        old_status=payload.old_status,
        new_status=payload.new_status,
    )
    db.commit()
    db.refresh(record)

    ids = {value for value in [record.superadmin_id or record.admin_id, record.user_id or record.target_user_id] if value}
    users = db.query(User.user_id, User.user_name).filter(User.user_id.in_(ids)).all() if ids else []
    name_map = {user_id: user_name for user_id, user_name in users}
    return _serialize_record(record, name_map, name_map)
