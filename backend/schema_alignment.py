from sqlalchemy import text

from database import engine


USER_VERIFICATION_COLUMN_STATEMENTS = [
    """
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL
    """,
    """
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255) NULL
    """,
    """
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verification_token_expires TIMESTAMP NULL
    """,
]

SUPERADMIN_AUDIT_LOG_COLUMN_STATEMENTS = [
    """
    ALTER TABLE superadmin_audit_logs
    ADD COLUMN IF NOT EXISTS superadmin_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL
    """,
    """
    ALTER TABLE superadmin_audit_logs
    ADD COLUMN IF NOT EXISTS audit_date TIMESTAMP DEFAULT now()
    """,
    """
    ALTER TABLE superadmin_audit_logs
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL
    """,
    """
    ALTER TABLE superadmin_audit_logs
    ADD COLUMN IF NOT EXISTS user_name VARCHAR(255)
    """,
    """
    ALTER TABLE superadmin_audit_logs
    ADD COLUMN IF NOT EXISTS action_notes TEXT
    """,
    """
    ALTER TABLE superadmin_audit_logs
    ADD COLUMN IF NOT EXISTS old_status VARCHAR(100)
    """,
    """
    ALTER TABLE superadmin_audit_logs
    ADD COLUMN IF NOT EXISTS new_status VARCHAR(100)
    """,
    """
    ALTER TABLE superadmin_audit_logs
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now()
    """,
]

SUPERADMIN_AUDIT_LOG_BACKFILL_STATEMENTS = [
    """
    UPDATE superadmin_audit_logs
    SET superadmin_id = COALESCE(superadmin_id, admin_id)
    WHERE superadmin_id IS NULL
      AND admin_id IS NOT NULL
    """,
    """
    UPDATE superadmin_audit_logs
    SET user_id = COALESCE(user_id, target_user_id)
    WHERE user_id IS NULL
      AND target_user_id IS NOT NULL
    """,
    """
    UPDATE superadmin_audit_logs AS logs
    SET user_name = users.user_name
    FROM users
    WHERE logs.user_name IS NULL
      AND COALESCE(logs.user_id, logs.target_user_id) = users.user_id
    """,
    """
    UPDATE superadmin_audit_logs
    SET action_notes = CASE
        WHEN action = 'deactivated' THEN 'Account deactivated'
        WHEN action = 'reactivated' THEN 'Account activated'
        WHEN action = 'approved' THEN 'Account activated'
        WHEN action = 'created' THEN 'Created Barangay Admin account'
        WHEN action = 'deleted' THEN 'Deleted Barangay Admin account'
        ELSE action
    END
    WHERE action_notes IS NULL
      AND action IS NOT NULL
    """,
    """
    UPDATE superadmin_audit_logs
    SET new_status = CASE
        WHEN action = 'deactivated' THEN 'inactive'
        WHEN action = 'reactivated' THEN 'active'
        WHEN action = 'approved' THEN 'active'
        WHEN action = 'created' THEN 'pending'
        WHEN action = 'deleted' THEN 'deleted'
        ELSE NULL
    END
    WHERE new_status IS NULL
      AND action IS NOT NULL
    """,
    """
    UPDATE superadmin_audit_logs
    SET audit_date = COALESCE(audit_date, created_at, now())
    WHERE audit_date IS NULL
    """,
    """
    UPDATE superadmin_audit_logs
    SET created_at = COALESCE(created_at, audit_date, now())
    WHERE created_at IS NULL
    """,
]


def ensure_user_verification_columns() -> None:
    with engine.begin() as conn:
        for statement in USER_VERIFICATION_COLUMN_STATEMENTS:
            conn.execute(text(statement))


def ensure_superadmin_audit_log_columns() -> None:
    with engine.begin() as conn:
        for statement in SUPERADMIN_AUDIT_LOG_COLUMN_STATEMENTS:
            conn.execute(text(statement))

        for statement in SUPERADMIN_AUDIT_LOG_BACKFILL_STATEMENTS:
            conn.execute(text(statement))


def sync_users_user_id_sequence() -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                SELECT setval(
                    pg_get_serial_sequence('users', 'user_id'),
                    COALESCE((SELECT MAX(user_id) FROM users), 0) + 1,
                    false
                )
                """
            )
        )


def auto_resolve_rated_complaints() -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                UPDATE complaint
                SET complaint_status = 'resolved'
                WHERE service_rating IS NOT NULL
                  AND complaint_status != 'resolved'
                """
            )
        )
