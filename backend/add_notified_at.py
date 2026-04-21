import os
import sys

# add backend dir to sys path so we can import database
sys.path.append('c:\\xampp\\htdocs\\civireport\\backend')

from database import engine
from sqlalchemy import text

def add_columns():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN notified_at TIMESTAMP NULL;"))
            print("Added notified_at to users")
        except Exception as e:
            print("Error on users:", e)
            
        try:
            conn.execute(text("ALTER TABLE complaint ADD COLUMN notified_at TIMESTAMP NULL;"))
            print("Added notified_at to complaint")
        except Exception as e:
            print("Error on complaint:", e)
            
        conn.commit()

add_columns()
