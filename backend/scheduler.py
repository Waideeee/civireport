import asyncio
import logging
import os
from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import text

from database import SessionLocal
from mailer import (
    send_admin_awaiting_rating_alert_email,
    send_rating_followup_email,
    send_resident_rating_reminder_email,
)


logger = logging.getLogger(__name__)

SCHEDULER_TIMEZONE = os.getenv("SCHEDULER_TIMEZONE", "Asia/Manila")

scheduler = BackgroundScheduler(timezone=SCHEDULER_TIMEZONE)

UNRESOLVED_COMPLAINTS_SQL = """
SELECT
    c.complaint_id,
    c.user_id,
    c.complaint_type,
    c.complaint_subtype,
    c.additional_notes,
    c.complaint_date,
    c.updated_at,
    c.notified_at,
    u.user_name AS resident_name,
    u.email AS resident_email,
    u.contact_num AS resident_contact_num
FROM complaint AS c
JOIN users AS u ON c.user_id = u.user_id
WHERE c.complaint_status = :complaint_status
  AND c.service_rating IS NULL
  AND c.updated_at < :updated_before
  AND (
      c.notified_at IS NULL
      OR c.notified_at < :notified_before
  )
ORDER BY c.updated_at ASC
"""

PENDING_RATINGS_SQL = """
SELECT
    c.complaint_id,
    c.user_id,
    c.complaint_type,
    c.complaint_subtype,
    c.complaint_date,
    c.notified_at,
    u.user_name AS resident_name,
    u.email AS resident_email
FROM complaint AS c
JOIN users AS u ON c.user_id = u.user_id
WHERE c.complaint_status = :complaint_status
  AND c.service_rating IS NULL
  AND c.notified_at IS NOT NULL
  AND c.notified_at < :notified_before
ORDER BY c.notified_at ASC
"""

ADMIN_EMAILS_SQL = """
SELECT user_id, user_name, email
FROM users
WHERE role = :role
  AND email IS NOT NULL
  AND TRIM(email) <> ''
ORDER BY user_id ASC
"""

UPDATE_COMPLAINT_NOTIFIED_SQL = """
UPDATE complaint
SET notified_at = :notified_at
WHERE complaint_id = :complaint_id
"""

INSERT_COMMUNICATION_SQL = """
INSERT INTO complaint_communications (
    complaint_id,
    sent_by_user_id,
    communication_type,
    subject,
    message,
    sent_at
) VALUES (
    :complaint_id,
    :sent_by_user_id,
    :communication_type,
    :subject,
    :message,
    :sent_at
)
"""

COMMUNICATION_TABLE_EXISTS_SQL = """
SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = :table_name
)
"""


def _run_async(coro):
    return asyncio.run(coro)


def _complaint_details(row) -> str:
    parts = [row.complaint_type or ""]
    if getattr(row, "complaint_subtype", None):
        parts.append(row.complaint_subtype)
    if getattr(row, "additional_notes", None):
        parts.append(row.additional_notes)
    return " - ".join(part for part in parts if part).strip() or "No complaint details provided."


def _communication_table_exists(session) -> bool:
    return bool(
        session.execute(
            text(COMMUNICATION_TABLE_EXISTS_SQL),
            {"table_name": "complaint_communications"},
        ).scalar()
    )


def check_unresolved_complaints():
    session = SessionLocal()
    now = datetime.utcnow()
    updated_before = now - timedelta(days=7)
    notified_before = now - timedelta(days=7)

    try:
        if not _communication_table_exists(session):
            logger.error("complaint_communications table does not exist. Skipping check_unresolved_complaints job.")
            return

        complaints = session.execute(
            text(UNRESOLVED_COMPLAINTS_SQL),
            {
                "complaint_status": "in_progress",
                "updated_before": updated_before,
                "notified_before": notified_before,
            },
        ).fetchall()

        admins = session.execute(
            text(ADMIN_EMAILS_SQL),
            {"role": "barangay_admin"},
        ).fetchall()

        logger.info("check_unresolved_complaints found %s qualifying complaint(s)", len(complaints))

        for row in complaints:
            try:
                details = _complaint_details(row)
                resident_contact = row.resident_contact_num or "No contact info on file"

                resident_sent = _run_async(
                    send_resident_rating_reminder_email(
                        user_email=row.resident_email,
                        user_name=row.resident_name,
                        complaint_id=row.complaint_id,
                        complaint_type=row.complaint_type or "",
                        complaint_details=details,
                    )
                )

                admin_sent_any = False
                for admin in admins:
                    sent = _run_async(
                        send_admin_awaiting_rating_alert_email(
                            admin_email=admin.email,
                            complaint_id=row.complaint_id,
                            complaint_type=row.complaint_type or "",
                            complaint_details=details,
                            resident_name=row.resident_name or "",
                            resident_contact_info=resident_contact,
                        )
                    )
                    admin_sent_any = admin_sent_any or sent

                if not resident_sent:
                    logger.warning(
                        "Resident reminder was not sent for complaint #%s; skipping notification timestamp update.",
                        row.complaint_id,
                    )
                    session.rollback()
                    continue

                if admins and not admin_sent_any:
                    logger.warning(
                        "Admin alerts were not sent for complaint #%s; skipping notification timestamp update.",
                        row.complaint_id,
                    )
                    session.rollback()
                    continue

                session.execute(
                    text(UPDATE_COMPLAINT_NOTIFIED_SQL),
                    {"complaint_id": row.complaint_id, "notified_at": now},
                )
                session.execute(
                    text(INSERT_COMMUNICATION_SQL),
                    {
                        "complaint_id": row.complaint_id,
                        "sent_by_user_id": None,
                        "communication_type": "reminder",
                        "subject": "Reminder sent - awaiting resident rating",
                        "message": "Auto-reminder sent to resident and admin. Complaint in progress for 7+ days.",
                        "sent_at": now,
                    },
                )
                session.commit()
                logger.info("Logged unresolved complaint reminder for complaint #%s", row.complaint_id)
            except Exception as exc:
                session.rollback()
                logger.exception(
                    "Failed while processing unresolved complaint reminder for complaint #%s: %s",
                    row.complaint_id,
                    exc,
                )
    except Exception as exc:
        session.rollback()
        logger.exception("check_unresolved_complaints failed: %s", exc)
    finally:
        session.close()


def check_pending_ratings():
    session = SessionLocal()
    now = datetime.utcnow()
    notified_before = now - timedelta(days=3)

    try:
        if not _communication_table_exists(session):
            logger.error("complaint_communications table does not exist. Skipping check_pending_ratings job.")
            return

        complaints = session.execute(
            text(PENDING_RATINGS_SQL),
            {
                "complaint_status": "in_progress",
                "notified_before": notified_before,
            },
        ).fetchall()

        logger.info("check_pending_ratings found %s qualifying complaint(s)", len(complaints))

        for row in complaints:
            try:
                complaint_date = (
                    row.complaint_date.strftime("%Y-%m-%d %H:%M:%S")
                    if row.complaint_date
                    else "N/A"
                )

                resident_sent = _run_async(
                    send_rating_followup_email(
                        user_email=row.resident_email,
                        user_name=row.resident_name,
                        complaint_id=row.complaint_id,
                        complaint_type=row.complaint_type or "",
                        complaint_date=complaint_date,
                    )
                )

                if not resident_sent:
                    logger.warning(
                        "Follow-up reminder was not sent for complaint #%s; skipping notification timestamp update.",
                        row.complaint_id,
                    )
                    session.rollback()
                    continue

                session.execute(
                    text(UPDATE_COMPLAINT_NOTIFIED_SQL),
                    {"complaint_id": row.complaint_id, "notified_at": now},
                )
                session.execute(
                    text(INSERT_COMMUNICATION_SQL),
                    {
                        "complaint_id": row.complaint_id,
                        "sent_by_user_id": None,
                        "communication_type": "reminder",
                        "subject": "Follow-up reminder - pending rating",
                        "message": "Follow-up reminder sent to resident. 3 days since last notification.",
                        "sent_at": now,
                    },
                )
                session.commit()
                logger.info("Logged pending rating follow-up for complaint #%s", row.complaint_id)
            except Exception as exc:
                session.rollback()
                logger.exception(
                    "Failed while processing pending rating follow-up for complaint #%s: %s",
                    row.complaint_id,
                    exc,
                )
    except Exception as exc:
        session.rollback()
        logger.exception("check_pending_ratings failed: %s", exc)
    finally:
        session.close()


def start_scheduler():
    if scheduler.running:
        logger.info("Reminder scheduler already running.")
        return scheduler

    if not scheduler.get_job("check_unresolved_complaints"):
        scheduler.add_job(
            check_unresolved_complaints,
            trigger="cron",
            hour=8,
            minute=0,
            id="check_unresolved_complaints",
            name="check_unresolved_complaints",
            replace_existing=True,
        )

    if not scheduler.get_job("check_pending_ratings"):
        scheduler.add_job(
            check_pending_ratings,
            trigger="cron",
            hour=9,
            minute=0,
            id="check_pending_ratings",
            name="check_pending_ratings",
            replace_existing=True,
        )

    scheduler.start()
    logger.info("Reminder scheduler started with jobs: %s", [job.id for job in scheduler.get_jobs()])
    return scheduler


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Reminder scheduler stopped.")
