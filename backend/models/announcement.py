from sqlalchemy import Column, Date, Integer, String, Text, TIMESTAMP
from sqlalchemy.sql import func
from database import Base

class Announcement(Base):
    __tablename__ = "announcements"

    announcement_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_name = Column(String(255), nullable=True)
    announcement_title = Column(String(255), nullable=False)
    announcement_category = Column(String(50), nullable=False, default="Community")
    post_date = Column(Date, nullable=False)
    event_date = Column(Date, nullable=False)
    announcement_venue = Column(String(255), nullable=False)
    announcement_description = Column(Text, nullable=False)
    who_will_attend = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=True)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=True)
