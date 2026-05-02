from sqlalchemy import Boolean, Column, Date, Integer, String, TIMESTAMP
from database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String(255))
    email = Column(String(255))
    gender = Column(String(50))
    contact_num = Column(String(255))
    address = Column(String(500))
    password = Column(String(255))
    profile_photo_path = Column(String(2048))
    date_registered = Column(Date)
    role = Column(String(255))
    is_active = Column(Boolean)
    approved_at = Column(Date)
    status = Column(String(50), default="pending")
    rejection_reason = Column(String(500))
    two_factor_secret = Column(String, nullable=True)
    two_factor_recovery_codes = Column(String, nullable=True)
    two_factor_confirmed_at = Column(TIMESTAMP, nullable=True)
    two_factor_recovery_code = Column(String, nullable=True)
    notified_at = Column(TIMESTAMP, nullable=True)
    email_verified_at = Column(TIMESTAMP, nullable=True)
    email_verification_token = Column(String(255), nullable=True)
    email_verification_token_expires = Column(TIMESTAMP, nullable=True)

    @property
    def barangay(self):
        return self.address
