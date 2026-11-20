from typing import List, Optional
from pydantic import BaseModel


class MarkEntryItem(BaseModel):
    student_id: str
    marks_obtained: float
    remarks: Optional[str] = None


class BulkMarkEntryRequest(BaseModel):
    subject_id: str
    assessment_type_id: str
    semester_id: str
    entries: List[MarkEntryItem]


class AssessmentConfigCreate(BaseModel):
    code: str
    name: str
    max_marks: float
    weightage_percent: float
    passing_marks: float


class StudentSemesterResult(BaseModel):
    semester_number: int
    academic_year: str
    total_credits: int
    gpa: float
    cgpa: float
    result_status: str
    is_published: bool
    subject_marks: List[dict]
