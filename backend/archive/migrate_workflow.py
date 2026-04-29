from sqlalchemy import text
from database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migration():
    commands = [
        # Add columns to complaint table
        "ALTER TABLE complaint ADD COLUMN IF NOT EXISTS resolution_feedback TEXT;",
        "ALTER TABLE complaint ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE complaint ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
        
        # Create service_ratings table
        """
        CREATE TABLE IF NOT EXISTS service_ratings (
            id SERIAL PRIMARY KEY,
            complaint_id INTEGER REFERENCES complaint(complaint_id),
            user_id INTEGER REFERENCES users(user_id),
            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
            feedback TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
    ]

    with engine.connect() as conn:
        for cmd in commands:
            try:
                conn.execute(text(cmd))
                conn.commit()
                logger.info(f"Successfully executed: {cmd[:50]}...")
            except Exception as e:
                logger.error(f"Failed to execute command: {cmd[:50]}... Error: {e}")
                conn.rollback()

if __name__ == "__main__":
    run_migration()
