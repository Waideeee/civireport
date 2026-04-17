from sqlalchemy import Column, Integer, String, Text, Date
from database import Base

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    post_date = Column(Date, nullable=False)
    event_date = Column(Date, nullable=False)
    venue = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    who_will_attend = Column(String(255), nullable=False)
    admin_id = Column(Integer, nullable=True)
