from database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

tables_and_columns = {
    'emergencies': ['created_at', 'resolved_at'],
    'users': ['date_registered', 'approved_at', 'two_factor_confirmed_at', 'notified_at'],
    'complaint': ['complaint_date', 'created_at', 'notified_at'],
    'announcements': ['post_date', 'event_date', 'created_at', 'updated_at'],
    'audit_logs': ['audit_date', 'created_at', 'updated_at']
}

try:
    for table, columns in tables_and_columns.items():
        for col in columns:
            print(f"Altering {table}.{col} to TIMESTAMP(0)")
            db.execute(text(f"ALTER TABLE {table} ALTER COLUMN {col} TYPE TIMESTAMP(0)"))
    db.commit()
    print("Database updated successfully.")
except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
