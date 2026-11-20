from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, DateTime, Text
from app.models.base import BaseModel


class ApprovalRecord(BaseModel):
    __tablename__ = "approval_records"

    entity_type = Column(String(50), nullable=False)  # MARKS, ATTENDANCE_CORRECTION, RESULT_PUBLISH
    entity_id = Column(String(36), nullable=False, index=True)
    requested_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    reviewed_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    status = Column(String(30), default="PENDING", nullable=False)  # PENDING, APPROVED, REJECTED
    comments = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)


class AuditLog(BaseModel):
    __tablename__ = "audit_logs"

    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)         # CREATE_STUDENT, UPDATE_MARKS, ACCESS_CONTACT_DIARY
    entity_type = Column(String(50), nullable=False, index=True)     # STUDENT, MARKS, ATTENDANCE, CONTACT
    entity_id = Column(String(36), nullable=True, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    previous_state = Column(Text, nullable=True)                     # JSON serialized state
    new_state = Column(Text, nullable=True)                          # JSON serialized state
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
