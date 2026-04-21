from pydantic import BaseModel
from typing import Optional, Literal
from datetime import date

class AnnouncementBase(BaseModel):
    title: str
    category: Literal['Community', 'Health', 'Education', 'Culture']
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
