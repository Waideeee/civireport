import sys
from sqlalchemy import create_engine, text
from database import DATABASE_URL

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    conn.execute(text("SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));"))
    conn.commit()

print("PostgreSQL User Sequence Fixed!")
