import sys
from datetime import datetime, UTC
sys.path.append('c:/xampp/htdocs/civireport/backend')
from database import engine
from sqlalchemy import text

try:
    with engine.begin() as conn:
        now_str = datetime.now(UTC).strftime('%Y-%m-%d %H:%M:%S')
        
        conn.execute(text(f"""
            INSERT INTO complaint 
            (user_id, complaint_type, complaint_subtype, complaint_location, urgency_level, additional_notes, complaint_status, complaint_date, created_at, updated_at) 
            VALUES 
            (10, 'Infrastructure', 'Broken Streetlight', 'Main St. and 1st Ave.', 'High', 'The streetlight has been broken for 3 days.', 'pending', '{now_str}', '{now_str}', '{now_str}')
        """))
        
        conn.execute(text(f"""
            INSERT INTO complaint 
            (user_id, complaint_type, complaint_subtype, complaint_location, urgency_level, additional_notes, complaint_status, complaint_date, created_at, updated_at) 
            VALUES 
            (13, 'Peace & Order', 'Noise Disturbance', 'Block 4, Lot 12', 'Medium', 'Loud karaoke music playing past midnight.', 'pending', '{now_str}', '{now_str}', '{now_str}')
        """))
        print('Successfully created complaints for users 10 and 13 using raw SQL.')
except Exception as e:
    print('Error:', e)
