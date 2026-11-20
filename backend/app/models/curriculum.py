from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Subject(BaseModel):
    __tablename__ = "subjects"

    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    code = Column(String(30), unique=True, nullable=False, index=True)  # e.g. "CS8491"
    name = Column(String(150), nullable=False)
    subject_type = Column(String(30), default="THEORY", nullable=False)  # THEORY, PRACTICAL, ELECTIVE, SEMINAR
    credits = Column(Integer, default=3, nullable=False)
    semester_number = Column(Integer, nullable=False)                   # Semester 1-8
    syllabus_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    department = relationship("Department", back_populates="subjects")
    allocations = relationship("SubjectAllocation", back_populates="subject")
    enrollments = relationship("StudentEnrollment", back_populates="subject")
    marks = relationship("Mark", back_populates="subject")


class StudentEnrollment(BaseModel):
    __tablename__ = "student_enrollments"

    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False)
    semester_id = Column(String(36), ForeignKey("semesters.id"), nullable=False)
    academic_year_id = Column(String(36), ForeignKey("academic_years.id"), nullable=False)
    enrollment_status = Column(String(20), default="ENROLLED", nullable=False)  # ENROLLED, COMPLETED, DROPPED
    is_active = Column(Boolean, default=True, nullable=False)

    student = relationship("Student", back_populates="enrollments")
    subject = relationship("Subject", back_populates="enrollments")
