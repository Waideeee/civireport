import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models.auditlog import AuditLog

try:
    db = SessionLocal()
    # Delete AUD-001 (audit_id=1) and AUD-002 (audit_id=2)
    logs_to_delete = db.query(AuditLog).filter(AuditLog.audit_id.in_([1, 2])).all()
    count = 0
    for log in logs_to_delete:
        db.delete(log)
        count += 1
    db.commit()
    print(f"SUCCESS: Deleted {count} records from AuditLog.")
except Exception as e:
    print(f"ERROR: {e}")
finally:
    db.close()
