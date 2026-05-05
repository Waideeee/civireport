import os
from datetime import datetime
from pathlib import Path
from typing import List

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.announcement import Announcement
from models.user import User
from schemas.announcement import (
    AnnouncementCreate,
    AnnouncementResponse,
    AnnouncementUpdate,
)
from security import require_admin_actor

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

ADMIN_BACKEND_URL = os.getenv("ADMIN_BACKEND_URL", "http://127.0.0.1:8002").rstrip("/")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")

router = APIRouter(prefix="/announcements", tags=["Announcements"])


def _send_announcement_broadcast(
    title: str, description: str, event_date: str, venue: str
):
    try:
        requests.post(
            f"{ADMIN_BACKEND_URL}/complaints/internal/broadcast",
            headers={
                "X-Internal-Key": INTERNAL_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "message": {
                    "type": "announcement",
                    "title": title,
                    "description": description,
                    "event_date": event_date,
                    "venue": venue,
                },
            },
            timeout=5,
        )
    except Exception:
        pass


@router.get("/", response_model=List[AnnouncementResponse])
def get_announcements(db: Session = Depends(get_db)):
    announcements = (
        db.query(Announcement, User)
        .outerjoin(User, Announcement.user_id == User.user_id)
        .order_by(Announcement.announcement_id.desc())
        .all()
    )
    return [
        {
            "announcement_id": announcement.announcement_id,
            "title": announcement.announcement_title,
            "category": announcement.announcement_category,
            "post_date": announcement.post_date,
            "event_date": announcement.event_date,
            "venue": announcement.announcement_venue,
            "description": announcement.announcement_description,
            "who_will_attend": announcement.who_will_attend,
            "admin_id": announcement.user_id,
            "creator_name": creator.user_name if creator else announcement.user_name,
            "creator_role": creator.role if creator else None,
        }
        for announcement, creator in announcements
    ]


@router.post(
    "/",
    response_model=AnnouncementResponse,
    dependencies=[Depends(require_admin_actor)],
)
def create_announcement(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    x_civireport_actor_id: str | None = Header(
        default=None, alias="X-CiviReport-Actor-Id"
    ),
):
    try:
        actor_id = int(x_civireport_actor_id) if x_civireport_actor_id else None
    except (ValueError, TypeError):
        actor_id = None
    actor = (
        db.query(User).filter(User.user_id == actor_id).first() if actor_id else None
    )
    announcement = Announcement(
        user_id=actor_id,
        user_name=actor.user_name if actor else None,
        announcement_title=payload.title,
        announcement_category=payload.category,
        post_date=payload.post_date,
        event_date=payload.event_date,
        announcement_venue=payload.venue,
        announcement_description=payload.description,
        who_will_attend=payload.who_will_attend,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    _send_announcement_broadcast(
        title=announcement.announcement_title,
        description=announcement.announcement_description,
        event_date=str(announcement.event_date) if announcement.event_date else "",
        venue=announcement.announcement_venue or "",
    )
    return {
        "announcement_id": announcement.announcement_id,
        "title": announcement.announcement_title,
        "category": announcement.announcement_category,
        "post_date": announcement.post_date,
        "event_date": announcement.event_date,
        "venue": announcement.announcement_venue,
        "description": announcement.announcement_description,
        "who_will_attend": announcement.who_will_attend,
        "admin_id": announcement.user_id,
        "creator_name": actor.user_name if actor else announcement.user_name,
        "creator_role": actor.role if actor else None,
    }


@router.put(
    "/{announcement_id}",
    response_model=AnnouncementResponse,
    dependencies=[Depends(require_admin_actor)],
)
def update_announcement(
    announcement_id: int,
    payload: AnnouncementUpdate,
    db: Session = Depends(get_db),
    x_civireport_actor_id: str | None = Header(
        default=None, alias="X-CiviReport-Actor-Id"
    ),
):
    announcement = (
        db.query(Announcement)
        .filter(Announcement.announcement_id == announcement_id)
        .first()
    )
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    try:
        actor_id = int(x_civireport_actor_id) if x_civireport_actor_id else None
    except (ValueError, TypeError):
        actor_id = None
    actor = (
        db.query(User).filter(User.user_id == actor_id).first() if actor_id else None
    )
    announcement.user_id = actor_id
    announcement.user_name = actor.user_name if actor else announcement.user_name
    announcement.announcement_title = payload.title
    announcement.announcement_category = payload.category
    announcement.post_date = payload.post_date
    announcement.event_date = payload.event_date
    announcement.announcement_venue = payload.venue
    announcement.announcement_description = payload.description
    announcement.who_will_attend = payload.who_will_attend
    announcement.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(announcement)
    return {
        "announcement_id": announcement.announcement_id,
        "title": announcement.announcement_title,
        "category": announcement.announcement_category,
        "post_date": announcement.post_date,
        "event_date": announcement.event_date,
        "venue": announcement.announcement_venue,
        "description": announcement.announcement_description,
        "who_will_attend": announcement.who_will_attend,
        "admin_id": announcement.user_id,
        "creator_name": actor.user_name if actor else announcement.user_name,
        "creator_role": actor.role if actor else None,
    }
