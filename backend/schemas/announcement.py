from pydantic import BaseModel
from typing import Optional
from datetime import date

class AnnouncementBase(BaseModel):
    title: str
    post_date: date
    event_date: date
    venue: str
    description: str
    who_will_attend: str
    admin_id: Optional[int] = None

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementUpdate(AnnouncementBase):
    pass

class AnnouncementResponse(AnnouncementBase):
    id: int

    class Config:
        from_attributes = True
