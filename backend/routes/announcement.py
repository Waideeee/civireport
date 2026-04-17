from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.announcement import Announcement
from schemas.announcement import AnnouncementResponse, AnnouncementCreate, AnnouncementUpdate
from typing import List

router = APIRouter(prefix="/announcements", tags=["Announcements"])

@router.get("/", response_model=List[AnnouncementResponse])
def get_announcements(db: Session = Depends(get_db)):
    announcements = db.query(Announcement).order_by(Announcement.id.desc()).all()
    return announcements

@router.post("/", response_model=AnnouncementResponse)
def create_announcement(payload: AnnouncementCreate, db: Session = Depends(get_db)):
    announcement = Announcement(**payload.model_dump())
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement

@router.put("/{announcement_id}", response_model=AnnouncementResponse)
def update_announcement(announcement_id: int, payload: AnnouncementUpdate, db: Session = Depends(get_db)):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    for key, value in payload.model_dump().items():
        setattr(announcement, key, value)
        
    db.commit()
    db.refresh(announcement)
    return announcement
