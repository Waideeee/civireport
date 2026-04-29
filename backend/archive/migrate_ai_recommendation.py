from database import engine, Base
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE complaint ADD COLUMN ai_recommendation TEXT;"))
            conn.commit()
            print("Successfully added ai_recommendation column to complaint.")
        except Exception as e:
            if "Duplicate column name" in str(e) or "already exists" in str(e).lower() or "Duplicate column" in str(e):
                print("Column ai_recommendation already exists in complaint.")
            else:
                print("Could not add column ai_recommendation to complaint:", e)

if __name__ == "__main__":
    run_migration()
