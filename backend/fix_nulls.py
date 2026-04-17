import sys
import os

# Append the current directory so models can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models.auditlog import AuditLog

try:
    db = SessionLocal()
    # Find any audit logs where old_status is literally None or the string "null"
    null_logs = db.query(AuditLog).filter((AuditLog.old_status == None) | (AuditLog.old_status == 'null')).all()
    count = 0
    for log in null_logs:
        log.old_status = 'Pending'
        count += 1
    db.commit()
    print(f"SUCCESS: Fixed {count} records in AuditLog.")
except Exception as e:
    print(f"ERROR: {e}")
finally:
    db.close()
