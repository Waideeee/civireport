import base64
import binascii
import os
import secrets
import time
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from dotenv import load_dotenv
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models.auditlog import AuditLog
from models.complaint import Complaint
from models.user import User
from schemas.complaint import ComplaintCreate, ComplaintRatingUpdate, ComplaintResponse, ComplaintStatusUpdate
from security import require_admin_actor
from mailer import send_complaint_resolved_email, send_complaint_update_email, send_new_complaint_email

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

BASE_URL = os.getenv("BASE_URL", "http://localhost:8001").rstrip("/")

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

DISSATISFIED_RATING_THRESHOLD = 2

MAX_PROOF_UPLOAD_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_SIGNATURES = {
    "jpg": (b"\xff\xd8\xff",),
    "png": (b"\x89PNG\r\n\x1a\n",),
    "webp": (b"RIFF",),
}
ALLOWED_MIME_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


def _determine_image_extension(file_data: bytes) -> str | None:
    if file_data.startswith(ALLOWED_IMAGE_SIGNATURES["jpg"][0]):
        return "jpg"
    if file_data.startswith(ALLOWED_IMAGE_SIGNATURES["png"][0]):
        return "png"
    if len(file_data) >= 12 and file_data.startswith(ALLOWED_IMAGE_SIGNATURES["webp"][0]) and file_data[8:12] == b"WEBP":
        return "webp"
    return None


def _save_resolution_media(complaint_id: int, action_proof: str) -> str:
    header = ""
    encoded = action_proof.strip()
    if "," in encoded:
        header, encoded = encoded.split(",", 1)

    try:
        file_data = base64.b64decode(encoded, validate=True)
    except (ValueError, binascii.Error) as exc:
        raise HTTPException(status_code=400, detail="Attached proof is not valid base64 data.") from exc

    if not file_data:
        raise HTTPException(status_code=400, detail="Attached proof is empty.")

    if len(file_data) > MAX_PROOF_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Attached proof exceeds the 5 MB upload limit.")

    detected_extension = _determine_image_extension(file_data)
    if not detected_extension:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, or WEBP proof images are allowed.")

    if header:
        mime_type = header.split(";")[0].replace("data:", "").strip().lower()
        expected_extension = ALLOWED_MIME_TYPES.get(mime_type)
        if expected_extension and expected_extension != detected_extension:
            raise HTTPException(status_code=400, detail="Proof image content does not match the provided MIME type.")

    uploads_dir = Path(__file__).resolve().parents[1] / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)

    filename = f"resolution_{complaint_id}_{int(time.time())}_{secrets.token_hex(4)}.{detected_extension}"
    filepath = uploads_dir / filename
    filepath.write_bytes(file_data)
    return filename


def _format_timestamp(value) -> str:
    if not value:
        return ""
    return value.strftime("%Y-%m-%d %H:%M:%S") if hasattr(value, "strftime") else str(value)


def _format_action_entry(action_number: int, note: str, timestamp: datetime) -> str:
    return f"Action {action_number} - {timestamp.strftime('%Y-%m-%d %H:%M:%S')}\n{note.strip()}"


def _build_media_url(file_path: str | None) -> str:
    if not file_path:
        return ""

    normalized_path = str(file_path).strip()
    lowered_path = normalized_path.lower()

    if lowered_path.startswith("http://") or lowered_path.startswith("https://"):
        return normalized_path

    cleaned_path = normalized_path.replace("\\", "/").lstrip("/")
    if cleaned_path.lower().startswith("uploads/"):
        cleaned_path = cleaned_path[8:]

    return f"{BASE_URL}/uploads/{cleaned_path.lstrip('/')}"


def _append_resolution_note(existing_notes: str | None, new_note: str, now: datetime) -> str:
    cleaned_new_note = new_note.strip()
    existing_text = (existing_notes or "").strip()

    if not existing_text:
        return _format_action_entry(1, cleaned_new_note, now)

    action_count = existing_text.count("Action ")
    if action_count == 0:
        existing_text = _format_action_entry(1, existing_text, now)
        action_count = 1

    next_action_number = action_count + 1
    return f"{existing_text}\n\n{_format_action_entry(next_action_number, cleaned_new_note, now)}"


def complaint_to_dict(c: Complaint, u: User | None):
    media_list = []
    if getattr(c, "complaint_media", None):
        for media in c.complaint_media:
            raw_path = (media.file_path or "").strip()
            # Resolve to disk path so we can read filename + size.
            disk_relative = raw_path.replace("\\", "/").lstrip("/")
            if disk_relative.lower().startswith("uploads/"):
                disk_relative = disk_relative[8:]
            disk_path = os.path.join("uploads", disk_relative) if disk_relative else None
            file_size = None
            if disk_path and os.path.isfile(disk_path):
                try:
                    file_size = os.path.getsize(disk_path)
                except OSError:
                    file_size = None
            file_name = os.path.basename(disk_relative) if disk_relative else None

            media_list.append({
                "media_id": media.media_id,
                "file_path": _build_media_url(media.file_path),
                "media_type": media.media_type,
                "file_name": file_name,
                "file_size": file_size,
            })

    service_feedback = None
    if c.service_rating is not None:
        service_feedback = {
            "rating": c.service_rating,
            "comment": (c.revision_feedback or "").strip() or None,
            "submitted_at": _format_timestamp(c.updated_at or c.created_at),
        }

    return {
        "complaint_id": c.complaint_id,
        "complaint_date": _format_timestamp(c.complaint_date),
        "complaint_type": c.complaint_type,
        "complaint_subtype": c.complaint_subtype,
        "complaint_location": c.complaint_location,
        "complaint_status": c.complaint_status,
        "urgency_level": c.urgency_level,
        "additional_notes": c.additional_notes,
        "rejection_reason": c.rejection_reason or "",
        "created_at": _format_timestamp(c.created_at),
        "updated_at": _format_timestamp(c.updated_at),
        "notified_at": _format_timestamp(c.notified_at),
        "user_id": c.user_id,
        "resident_name": u.user_name if u else "",
        "resident_email": u.email if u else "",
        "resident_contact_num": u.contact_num if u else "",
        "user_name": u.user_name if u else "",
        "user_email": u.email if u else "",
        "contact_num": u.contact_num if u else "",
        "media": media_list,
        "history": [],
        "resolved_media": c.resolved_media or "",
        "resolved_notes": c.resolved_notes or "",
        "ai_recommendation": c.ai_recommendation or "",
        "revision_feedback": c.revision_feedback or "",
        "service_rating": c.service_rating,
        "service_feedback": service_feedback,
    }


def _complaint_history(db: Session, complaint_id: int) -> list[dict]:
    rows = (
        db.query(
            AuditLog,
            User.user_name.label("actor_name"),
        )
        .outerjoin(User, AuditLog.user_id == User.user_id)
        .filter(AuditLog.complaint_id == complaint_id)
        .order_by(AuditLog.created_at.asc(), AuditLog.audit_id.asc())
        .all()
    )

    history = []
    for audit, actor_name in rows:
        history.append(
            {
                "audit_id": audit.audit_id,
                "date": _format_timestamp(audit.created_at or audit.audit_date),
                "old_status": audit.old_status or "",
                "new_status": audit.new_status or "",
                "actor_name": actor_name or audit.user_name or "System",
                "action_notes": audit.action_notes or "",
            }
        )
    return history


def _create_audit_log(
    db: Session,
    complaint_id: int,
    old_status: str,
    new_status: str,
    admin_id: int | None,
    action_notes: str | None,
):
    actor = db.query(User).filter(User.user_id == admin_id).first() if admin_id else None
    now = datetime.utcnow()
    db.add(
        AuditLog(
            complaint_id=complaint_id,
            old_status=old_status,
            new_status=new_status,
            user_id=admin_id,
            user_name=actor.user_name if actor else "System" if admin_id is None else None,
            action_notes=action_notes,
            audit_date=now,
            created_at=now,
            updated_at=now,
        )
    )


@router.get("/", response_model=list[ComplaintResponse])
def get_complaints(db: Session = Depends(get_db), _: None = Depends(require_admin_actor)):
    results = (
        db.query(Complaint, User)
        .outerjoin(User, Complaint.user_id == User.user_id)
        .options(joinedload(Complaint.complaint_media))
        .all()
    )
    output = []
    for complaint, user in results:
        item = complaint_to_dict(complaint, user)
        item["history"] = _complaint_history(db, complaint.complaint_id)
        output.append(item)
    return output


@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(complaint_id: int, db: Session = Depends(get_db), _: None = Depends(require_admin_actor)):
    result = (
        db.query(Complaint, User)
        .outerjoin(User, Complaint.user_id == User.user_id)
        .options(joinedload(Complaint.complaint_media))
        .filter(Complaint.complaint_id == complaint_id)
        .first()
    )
    if not result:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    complaint, user = result
    item = complaint_to_dict(complaint, user)
    item["history"] = _complaint_history(db, complaint.complaint_id)
    return item


@router.post("/")
def create_complaint(payload: ComplaintCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    complaint = Complaint(
        user_id=payload.user_id,
        complaint_type=payload.complaint_type,
        complaint_subtype=payload.complaint_subtype,
        complaint_location=payload.complaint_location,
        urgency_level=payload.urgency_level,
        additional_notes=payload.additional_notes,
        ai_recommendation=payload.ai_recommendation,
        complaint_status="pending",
        complaint_date=datetime.utcnow(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    user = db.query(User).filter(User.user_id == payload.user_id).first()
    if user and user.email:
        background_tasks.add_task(
            send_new_complaint_email,
            user_email=user.email,
            user_name=user.user_name,
            complaint_id=complaint.complaint_id,
            complaint_title=complaint.complaint_subtype,
        )

    return {"message": "Complaint created", "complaint_id": complaint.complaint_id}


@router.patch("/{complaint_id}/status")
def update_complaint_status(
    complaint_id: int,
    payload: ComplaintStatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin_actor),
):
    complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    old_status = (complaint.complaint_status or "").lower()
    new_status = (payload.complaint_status or "").lower()
    now = datetime.utcnow()

    if new_status == "in_progress":
        if old_status != "pending":
            raise HTTPException(status_code=400, detail="Only pending complaints can be marked as in progress.")
        if not payload.resolved_notes or not payload.resolved_notes.strip():
            raise HTTPException(status_code=400, detail="Action Taken is required.")

        complaint.complaint_status = "in_progress"
        complaint.resolved_notes = _append_resolution_note(complaint.resolved_notes, payload.resolved_notes, now)
        complaint.updated_at = now
        if payload.action_proof:
            complaint.resolved_media = _save_resolution_media(complaint_id, payload.action_proof)

        resident = db.query(User).filter(User.user_id == complaint.user_id).first()
        if resident and resident.email:
            background_tasks.add_task(
                send_complaint_update_email,
                user_email=resident.email,
                user_name=resident.user_name,
                complaint_id=complaint.complaint_id,
                complaint_type=complaint.complaint_type or "",
                complaint_subtype=complaint.complaint_subtype or "",
                complaint_location=complaint.complaint_location or "",
                new_status="In Progress",
                resolved_notes=complaint.resolved_notes or "",
            )
            complaint.notified_at = now

        _create_audit_log(
            db=db,
            complaint_id=complaint_id,
            old_status=old_status or "pending",
            new_status="in_progress",
            admin_id=payload.admin_id,
            action_notes=complaint.resolved_notes,
        )
        db.commit()
        db.refresh(complaint)
        return {"message": "Complaint marked as in progress.", "complaint_id": complaint_id, "status": complaint.complaint_status}

    if new_status == "rejected":
        if not payload.rejection_reason or not payload.rejection_reason.strip():
            raise HTTPException(status_code=400, detail="Rejection reason is required.")

        complaint.complaint_status = "rejected"
        complaint.rejection_reason = payload.rejection_reason.strip()[:500]
        complaint.updated_at = now
        _create_audit_log(
            db=db,
            complaint_id=complaint_id,
            old_status=old_status or "pending",
            new_status="rejected",
            admin_id=payload.admin_id,
            action_notes=complaint.rejection_reason,
        )
        db.commit()
        db.refresh(complaint)
        return {"message": "Complaint rejected.", "complaint_id": complaint_id, "status": complaint.complaint_status}

    raise HTTPException(
        status_code=400,
        detail="Unsupported complaint status update. Admin actions end at in_progress or rejected; resolved is the final status after resident rating.",
    )


@router.patch("/{complaint_id}/rate")
def rate_complaint(
    complaint_id: int,
    payload: ComplaintRatingUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    if complaint.complaint_status != "in_progress":
        raise HTTPException(status_code=400, detail="Only in-progress complaints can be rated.")

    if complaint.service_rating is not None:
        raise HTTPException(status_code=400, detail="This complaint has already been rated.")

    if payload.service_rating < 1 or payload.service_rating > 5:
        raise HTTPException(status_code=400, detail="service_rating must be between 1 and 5.")

    now = datetime.utcnow()
    resident_feedback = (payload.resolved_notes or "").strip()
    resident = db.query(User).filter(User.user_id == complaint.user_id).first()

    # Resident feedback belongs in revision_feedback, not in the admin's action notes.
    if resident_feedback:
        complaint.revision_feedback = resident_feedback

    complaint.updated_at = now

    if payload.service_rating <= DISSATISFIED_RATING_THRESHOLD:
        # Send the complaint back to pending so the admin can take another action.
        complaint.service_rating = None
        complaint.complaint_status = "pending"
        complaint.notified_at = None
    else:
        complaint.service_rating = payload.service_rating
        complaint.complaint_status = "resolved"

        if resident and resident.email:
            complaint_details = " - ".join(
                part for part in [complaint.complaint_type or "", complaint.complaint_subtype or ""] if part
            )
            background_tasks.add_task(
                send_complaint_resolved_email,
                user_email=resident.email,
                user_name=resident.user_name,
                complaint_id=complaint.complaint_id,
                complaint_type=complaint.complaint_type or "",
                complaint_details=complaint_details,
                action_history=complaint.resolved_notes or "",
            )

    db.add(
        AuditLog(
            complaint_id=complaint.complaint_id,
            old_status="in_progress",
            new_status=complaint.complaint_status,
            user_id=complaint.user_id,
            user_name=resident.user_name if resident else "System",
            action_notes=(
                f"Resident rated {payload.service_rating}/5."
                + (f" Feedback: {resident_feedback}" if resident_feedback else "")
            )[:1000],
            audit_date=now,
            created_at=now,
            updated_at=now,
        )
    )

    db.commit()
    db.refresh(complaint)
    return {
        "message": "Complaint rated successfully.",
        "complaint_id": complaint_id,
        "status": complaint.complaint_status,
        "service_rating": complaint.service_rating,
    }
