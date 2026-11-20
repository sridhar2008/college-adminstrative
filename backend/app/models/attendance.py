from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, Date, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class AttendanceSession(BaseModel):
    __tablename__ = "attendance_sessions"

    subject_allocation_id = Column(String(36), ForeignKey("subject_allocations.id"), nullable=False)
    session_date = Column(Date, nullable=False, index=True)
    period_number = Column(Integer, nullable=False)  # 1 to 8
    topic_covered = Column(String(255), nullable=True)
    conducted_by_faculty_id = Column(String(36), ForeignKey("faculty.id"), nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)  # Locked once verified

    subject_allocation = relationship("SubjectAllocation", back_populates="attendance_sessions")
    records = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint(
            "subject_allocation_id", "session_date", "period_number",
            name="uq_allocation_date_period"
        ),
    )


class AttendanceRecord(BaseModel):
    __tablename__ = "attendance_records"

    session_id = Column(String(36), ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    status = Column(String(20), nullable=False)  # PRESENT, ABSENT, ON_DUTY, MEDICAL_LEAVE
    remarks = Column(String(255), nullable=True)
    marked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    session = relationship("AttendanceSession", back_populates="records")
    student = relationship("Student", back_populates="attendance_records")

    __table_args__ = (
        UniqueConstraint("session_id", "student_id", name="uq_session_student"),
    )
