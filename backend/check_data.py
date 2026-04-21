import sys
sys.path.append('c:\\xampp\\htdocs\\civireport\\backend')
from sqlalchemy import text
from database import engine

try:
    with engine.connect() as conn:
        res = conn.execute(text('SELECT complaint_id, complaint_status, notified_at FROM complaint')).fetchall()
        print("COMPLAINTS:", res)
        res = conn.execute(text('SELECT user_id, status, notified_at FROM users')).fetchall()
        print("USERS:", res)
except Exception as e:
    print(e)
