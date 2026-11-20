from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class AssessmentType(BaseModel):
    __tablename__ = "assessment_types"

    code = Column(String(50), unique=True, nullable=False, index=True)  # IA1, IA2, IA3, ASSIGNMENT, LAB, MODEL_EXAM
    name = Column(String(100), nullable=False)                          # Internal Assessment 1
    max_marks = Column(Float, default=100.0, nullable=False)
    weightage_percent = Column(Float, default=20.0, nullable=False)
    passing_marks = Column(Float, default=50.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    marks = relationship("Mark", back_populates="assessment_type")


class Mark(BaseModel):
    __tablename__ = "marks"

    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False)
    assessment_type_id = Column(String(36), ForeignKey("assessment_types.id"), nullable=False)
    semester_id = Column(String(36), ForeignKey("semesters.id"), nullable=False)
    marks_obtained = Column(Float, nullable=False)
    
    is_submitted = Column(Boolean, default=False, nullable=False)
    submitted_by_faculty_id = Column(String(36), ForeignKey("faculty.id"), nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    
    is_approved = Column(Boolean, default=False, nullable=False)
    approved_by_hod_id = Column(String(36), ForeignKey("faculty.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    
    remarks = Column(String(255), nullable=True)

    student = relationship("Student", back_populates="marks")
    subject = relationship("Subject", back_populates="marks")
    assessment_type = relationship("AssessmentType", back_populates="marks")

    __table_args__ = (
        UniqueConstraint("student_id", "subject_id", "assessment_type_id", "semester_id", name="uq_student_assessment"),
    )


class ExaminationResult(BaseModel):
    __tablename__ = "examination_results"

    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    semester_id = Column(String(36), ForeignKey("semesters.id"), nullable=False)
    academic_year_id = Column(String(36), ForeignKey("academic_years.id"), nullable=False)
    total_credits = Column(Integer, default=0, nullable=False)
    gpa = Column(Float, default=0.0, nullable=False)
    cgpa = Column(Float, default=0.0, nullable=False)
    result_status = Column(String(20), default="PENDING", nullable=False)  # PASS, FAIL, WITHHELD, PENDING
    is_published = Column(Boolean, default=False, nullable=False)
    published_at = Column(DateTime, nullable=True)
    published_by_admin_id = Column(String(36), ForeignKey("users.id"), nullable=True)

    student = relationship("Student", back_populates="results")

    __table_args__ = (
        UniqueConstraint("student_id", "semester_id", name="uq_student_semester_result"),
    )
