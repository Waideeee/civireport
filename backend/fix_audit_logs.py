from database import engine
from sqlalchemy import text

conn = engine.connect()
conn.execute(text("UPDATE audit_logs SET audit_date = CURRENT_TIMESTAMP, created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;"))
conn.commit()
conn.close()
print('Fixed missing audit log dates')
