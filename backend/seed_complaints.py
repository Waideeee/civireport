from database import SessionLocal
from models.complaint import Complaint
from models.user import User
from models.complaint_media import Complaint_media

def seed_in_progress_complaints():
    db = SessionLocal()
    try:
        # Check if we have any users, if not, create a dummy one
        user = db.query(User).first()
        if not user:
            user = User(user_name="John Doe", email="john@example.com", password="password123", contact_num="09123456789", role="user")
            db.add(user)
            db.commit()
            db.refresh(user)

        # Let's find existing "Pending" complaints and change 2 of them to "in progress", or just create new ones
        complaints = db.query(Complaint).limit(2).all()
        
        if not complaints:
            # Create dummy complaints
            for i in range(2):
                c = Complaint(
                    user_id=user.user_id,
                    complaint_type="Infrastructure",
                    complaint_subtype="Pothole",
                    complaint_location=f"Street {i+1}",
                    urgency_level="High",
                    additional_notes="This is a big pothole.",
                    complaint_status="in progress",
                    ai_recommendation="**Summary:** The reported pothole poses a high risk to motorists.\n\n**Action Steps:**\n1. Dispatch an inspection team within 24 hours.\n2. Secure the area with warning signs.\n3. Schedule immediate road repair.\n\n**Suggested Action:** Approve for immediate repair."
                )
                db.add(c)
        else:
            for c in complaints:
                c.complaint_status = "in progress"
                c.ai_recommendation = "**Summary:** The reported issue requires attention and poses a moderate to high risk to the community.\n\n**Action Steps:**\n1. Send an initial inspection team.\n2. Document the exact damage and required materials.\n3. Coordinate with the engineering department.\n\n**Suggested Action:** Review inspection report and proceed with repairs."

        db.commit()
        print("Successfully updated/seeded 'In Progress' complaints with AI recommendations.")

    except Exception as e:
        print("Error seeding data:", e)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_in_progress_complaints()
