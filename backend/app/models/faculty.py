from sqlalchemy import Column, String, Boolean, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Faculty(BaseModel):
    __tablename__ = "faculty"

    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    employee_id = Column(String(50), unique=True, nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    designation = Column(String(100), nullable=False)  # Professor, Associate Professor, Assistant Professor, Guest Lecturer
    qualification = Column(String(150), nullable=True) # Ph.D, M.Tech, M.S.
    specialization = Column(String(200), nullable=True)
    joining_date = Column(Date, nullable=False)
    is_hod = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="faculty_profile")
    department = relationship("Department", back_populates="faculty_members", foreign_keys=[department_id])
    allocations = relationship("SubjectAllocation", back_populates="faculty")


class Staff(BaseModel):
    __tablename__ = "staff"

    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    employee_id = Column(String(50), unique=True, nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    role_title = Column(String(100), nullable=False)  # Academic Registrar, Exam Cell Coordinator, Office Admin
    is_active = Column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="staff_profile")


class SubjectAllocation(BaseModel):
    __tablename__ = "subject_allocations"

    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False)
    faculty_id = Column(String(36), ForeignKey("faculty.id"), nullable=False)
    section_id = Column(String(36), ForeignKey("sections.id"), nullable=False)
    academic_year_id = Column(String(36), ForeignKey("academic_years.id"), nullable=False)
    semester_id = Column(String(36), ForeignKey("semesters.id"), nullable=False)
    is_primary = Column(Boolean, default=True, nullable=False)

    subject = relationship("Subject", back_populates="allocations")
    faculty = relationship("Faculty", back_populates="allocations")
    section = relationship("Section", back_populates="allocations")
    attendance_sessions = relationship("AttendanceSession", back_populates="subject_allocation")
