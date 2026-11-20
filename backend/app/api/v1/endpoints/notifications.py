from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.communication import Notification, Announcement
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()


class AnnouncementCreate(BaseModel):
    title: str
    content: str
    target_role: str = "ALL"
    department_id: Optional[str] = None
    is_pinned: bool = False


@router.get("/notifications")
def get_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve in-app notifications for authenticated user."""
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(20).all()

    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "category": n.category,
            "is_read": n.is_read,
            "created_at": str(n.created_at),
            "action_url": n.action_url
        } for n in notifications
    ]


@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        notif.read_at = datetime.now(timezone.utc)
        db.commit()
    return {"success": True}


@router.get("/announcements")
def get_announcements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve relevant college-wide or role/department-specific announcements."""
    role_name = current_user.role.name if current_user.role else "ALL"
    
    announcements = db.query(Announcement).filter(
        (Announcement.target_role.in_(["ALL", role_name.upper()]))
    ).order_by(Announcement.is_pinned.desc(), Announcement.created_at.desc()).limit(15).all()

    return [
        {
            "id": a.id,
            "title": a.title,
            "content": a.content,
            "target_role": a.target_role,
            "is_pinned": a.is_pinned,
            "created_at": str(a.created_at)
        } for a in announcements
    ]


@router.post("/announcements")
def create_announcement(
    data: AnnouncementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Publish a new announcement for students, faculty, or the entire college."""
    ann = Announcement(
        title=data.title.strip(),
        content=data.content.strip(),
        target_role=data.target_role.upper(),
        department_id=data.department_id,
        posted_by_user_id=current_user.id,
        is_pinned=data.is_pinned
    )
    db.add(ann)
    db.commit()
    return {"success": True, "message": "Announcement published successfully.", "id": ann.id}

