from sqlalchemy import text
from database import engine

def check_schema():
    with engine.connect() as conn:
        # Check ENUM type
        res = conn.execute(text("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'complaint_status_enum';"))
        labels = [r[0] for r in res]
        print(f"ENUM labels: {labels}")
        
        # Check column type
        res = conn.execute(text("SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'complaint' AND column_name = 'complaint_status';"))
        col = res.fetchone()
        print(f"Column info: {col}")
        
        # Check if resolution_feedback exists
        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'complaint' AND column_name = 'resolution_feedback';"))
        exists = res.fetchone()
        print(f"resolution_feedback exists: {exists is not None}")
        
        # Check some data
        res = conn.execute(text("SELECT complaint_id, complaint_status FROM complaint LIMIT 5;"))
        rows = res.fetchall()
        print(f"Sample data: {rows}")

if __name__ == "__main__":
    check_schema()
