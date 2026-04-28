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


def ensure_user_verification_columns() -> None:
    with engine.begin() as conn:
        for statement in USER_VERIFICATION_COLUMN_STATEMENTS:
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
