from typing import List, Optional
from datetime import date
from pydantic import BaseModel


class AttendanceRecordEntry(BaseModel):
    student_id: str
    status: str  # PRESENT, ABSENT, ON_DUTY, MEDICAL_LEAVE
    remarks: Optional[str] = None


class AttendanceSessionCreate(BaseModel):
    subject_allocation_id: str
    session_date: date
    period_number: int
    topic_covered: Optional[str] = None
    records: List[AttendanceRecordEntry]


class AttendanceCorrectionRequest(BaseModel):
    session_id: str
    student_id: str
    requested_status: str
    reason: str


class StudentSubjectAttendanceSummary(BaseModel):
    subject_code: str
    subject_name: str
    conducted_classes: int
    attended_classes: int
    percentage: float
    status_alert: bool  # True if percentage < 75%
