from database import SessionLocal
from models.emergency import Emergency
from models.user import User

db = SessionLocal()

# Try to find a user first
user = db.query(User).first()
if not user:
    # create a dummy user if none exists
    user = User(user_name="John Doe", email="test@test.com", contact_num="09123456789")
    db.add(user)
    db.commit()
    db.refresh(user)

test_emergency = Emergency(
    user_id=user.user_id,
    location="789 Pine Road, Block 3",
    status="pending",
    notes=""
)
db.add(test_emergency)
db.commit()
print("Successfully created a test emergency alert.")
