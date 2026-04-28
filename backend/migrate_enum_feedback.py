from sqlalchemy import text
from database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migration():
    commands = [
        # 1. Add revision_feedback if it doesn't exist
        "ALTER TABLE complaint ADD COLUMN IF NOT EXISTS revision_feedback TEXT;",
        
        # 2. Copy data from resolution_feedback to revision_feedback if both exist
        """
        DO $$ 
        BEGIN 
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='complaint' AND column_name='resolution_feedback') THEN
                UPDATE complaint SET revision_feedback = resolution_feedback WHERE revision_feedback IS NULL;
            END IF;
        END $$;
        """,
        
        # 3. Drop resolution_feedback
        "ALTER TABLE complaint DROP COLUMN IF EXISTS resolution_feedback;",
        
        # 4. Create ENUM type (need to check if exists first)
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'complaint_status_enum') THEN
                CREATE TYPE complaint_status_enum AS ENUM ('pending', 'in progress', 'approved', 'rejected');
            END IF;
        END $$;
        """,
        
        # 5. Alter complaint_status column to ENUM
        # We need to lowercase existing values and map them to the enum
        """
        ALTER TABLE complaint 
        ALTER COLUMN complaint_status TYPE complaint_status_enum 
        USING (LOWER(complaint_status)::complaint_status_enum);
        """
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
