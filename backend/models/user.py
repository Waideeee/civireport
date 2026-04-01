from sqlalchemy import Column, Integer, String, Boolean, Date
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
    date_registered = Column(Date)
    role = Column(String(255))
    is_active = Column(Boolean)
    approved_at = Column(Date)
    status = Column(String(50), default="pending")