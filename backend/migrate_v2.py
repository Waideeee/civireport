from sqlalchemy import text
from database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migration():
    commands = [
        # 1. Backup table
        "DROP TABLE IF EXISTS complaint_backup;",
        "CREATE TABLE complaint_backup AS SELECT * FROM complaint;",
        
        # 2. Create ENUM type
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'complaint_status_enum') THEN
                CREATE TYPE complaint_status_enum AS ENUM ('pending', 'in_progress', 'approved', 'rejected');
            END IF;
        END $$;
        """,
        
        # 3. Convert complaint_status column to Enum
        # We handle 'in progress' -> 'in_progress' conversion
        """
        ALTER TABLE complaint 
        ALTER COLUMN complaint_status TYPE complaint_status_enum 
        USING (
            CASE 
                WHEN LOWER(complaint_status) = 'resolved' THEN 'approved'::complaint_status_enum
                ELSE (REPLACE(LOWER(COALESCE(complaint_status, 'pending')), ' ', '_'))::complaint_status_enum
            END
        );
        """,
        
        # 4. Drop resolution_feedback column
        "ALTER TABLE complaint DROP COLUMN IF EXISTS resolution_feedback;"
    ]

    with engine.connect() as conn:
        for cmd in commands:
            try:
                conn.execute(text(cmd))
                conn.commit()
                logger.info(f"Successfully executed: {cmd[:100]}...")
            except Exception as e:
                logger.error(f"Failed to execute command: {cmd[:100]}... Error: {e}")
                conn.rollback()

if __name__ == "__main__":
    run_migration()
