from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Text
from app.models.base import BaseModel


class Notification(BaseModel):
    __tablename__ = "notifications"

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="GENERAL", nullable=False)  # ATTENDANCE_ALERT, MARKS_UPDATE, EXAM_NOTICE, GENERAL
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime, nullable=True)
    action_url = Column(String(255), nullable=True)


class Announcement(BaseModel):
    __tablename__ = "announcements"

    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    target_role = Column(String(50), default="ALL", nullable=False)    # ALL, STUDENT, FACULTY, HOD, DEAN, PARENT
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True) # Null means institution-wide
    posted_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime, nullable=True)
