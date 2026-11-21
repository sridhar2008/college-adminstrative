from typing import Optional, List
from datetime import date
from pydantic import BaseModel


class StudentBase(BaseModel):
    roll_number: str
    registration_number: str
    department_id: str
    program_id: str
    batch_id: str
    current_semester_id: str
    section_id: str
    dob: date
    gender: str
    blood_group: Optional[str] = None
    college_email: str
    phone: Optional[str] = None
    residential_address: Optional[str] = None
    profile_image_url: Optional[str] = None
    admission_status: str = "CONFIRMED"
    academic_status: str = "ACTIVE"
    admission_date: date


class StudentCreate(StudentBase):
    full_name: str
    initial_password: str


class StudentDetail(StudentBase):
    id: str
    user_id: str
    full_name: str
    department_name: Optional[str] = None
    program_name: Optional[str] = None
    batch_name: Optional[str] = None
    semester_number: Optional[int] = None
    section_name: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class RollNumberLookupResponse(BaseModel):
    found: bool
    student: Optional[StudentDetail] = None
    attendance_summary: Optional[dict] = None
    recent_marks: Optional[List[dict]] = None
