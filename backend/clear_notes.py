from database import engine
from sqlalchemy import text

conn = engine.connect()
conn.execute(text("UPDATE emergencies SET notes = NULL WHERE notes LIKE '%Acknowledged by Admin%'"))
conn.commit()
conn.close()
print("Cleared")
