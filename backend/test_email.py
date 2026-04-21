import asyncio
import os
from dotenv import load_dotenv
from mailer import send_complaint_update_email

load_dotenv()

async def test_email():
    print("Testing email send...")
    print(f"Username: '{os.getenv('MAIL_USERNAME')}'")
    print(f"Password: '{os.getenv('MAIL_PASSWORD')}'")
    
    await send_complaint_update_email(
        user_email="barangaycivireports@gmail.com",
        user_name="Test User",
        complaint_id=999,
        complaint_title="Test Complaint",
        new_status="In Progress",
        resolved_notes="This is a test resolution note.",
        proof_filename=None
    )
    print("Done testing.")

if __name__ == "__main__":
    asyncio.run(test_email())
