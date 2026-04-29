from database import engine, Base
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        try:
            # Add category column as VARCHAR since we can restrict it in the application layer or use ENUM
            conn.execute(text("ALTER TABLE announcements ADD COLUMN category VARCHAR(50) DEFAULT 'Community' NOT NULL;"))
            conn.commit()
            print("Successfully added category column to announcements.")
        except Exception as e:
            if "Duplicate column name" in str(e) or "already exists" in str(e).lower() or "Duplicate column" in str(e):
                print("Column category already exists in announcements.")
            else:
                print("Could not add column category to announcements:", e)

if __name__ == "__main__":
    run_migration()
