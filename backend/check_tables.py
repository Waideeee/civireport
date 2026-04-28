from sqlalchemy import text
from database import engine

def check_schema():
    with engine.connect() as conn:
        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'complaint'"))
        cols = [r[0] for r in res]
        print(f"Complaint columns: {cols}")
        
        res = conn.execute(text("SELECT * FROM information_schema.tables WHERE table_name = 'service_ratings'"))
        exists = res.fetchone()
        print(f"service_ratings table exists: {exists is not None}")

if __name__ == "__main__":
    check_schema()
