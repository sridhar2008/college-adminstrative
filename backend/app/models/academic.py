from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Department(BaseModel):
    __tablename__ = "departments"

    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)
    hod_faculty_id = Column(String(36), ForeignKey("faculty.id", use_alter=True, name="fk_dept_hod"), nullable=True)
    established_year = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    programs = relationship("Program", back_populates="department")
    faculty_members = relationship("Faculty", back_populates="department", foreign_keys="Faculty.department_id")
    subjects = relationship("Subject", back_populates="department")


class Program(BaseModel):
    __tablename__ = "programs"

    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    name = Column(String(150), nullable=False)
    code = Column(String(30), unique=True, nullable=False, index=True)
    degree_level = Column(String(20), nullable=False)  # UG, PG, PhD
    duration_years = Column(Integer, nullable=False)    # 4 for UG, 2 for PG, configurable for PhD
    total_semesters = Column(Integer, nullable=False)   # 8 for UG, 4 for PG
    is_active = Column(Boolean, default=True, nullable=False)

    department = relationship("Department", back_populates="programs")
    batches = relationship("Batch", back_populates="program")


class AcademicYear(BaseModel):
    __tablename__ = "academic_years"

    code = Column(String(20), unique=True, nullable=False, index=True)  # e.g., "2025-2026"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_current = Column(Boolean, default=False, nullable=False)

    semesters = relationship("Semester", back_populates="academic_year")


class Semester(BaseModel):
    __tablename__ = "semesters"

    academic_year_id = Column(String(36), ForeignKey("academic_years.id"), nullable=False)
    number = Column(Integer, nullable=False)          # 1 to 8
    semester_type = Column(String(10), nullable=False) # ODD, EVEN
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    academic_year = relationship("AcademicYear", back_populates="semesters")
    sections = relationship("Section", back_populates="semester")


class Batch(BaseModel):
    __tablename__ = "batches"

    program_id = Column(String(36), ForeignKey("programs.id"), nullable=False)
    batch_name = Column(String(50), nullable=False)   # e.g. "2023-2027"
    admission_year = Column(Integer, nullable=False)
    graduation_year = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    program = relationship("Program", back_populates="batches")
    sections = relationship("Section", back_populates="batch")
    students = relationship("Student", back_populates="batch")


class Section(BaseModel):
    __tablename__ = "sections"

    batch_id = Column(String(36), ForeignKey("batches.id"), nullable=False)
    semester_id = Column(String(36), ForeignKey("semesters.id"), nullable=False)
    name = Column(String(10), nullable=False)          # "A", "B", "C"
    capacity = Column(Integer, default=60, nullable=False)

    batch = relationship("Batch", back_populates="sections")
    semester = relationship("Semester", back_populates="sections")
    students = relationship("Student", back_populates="section")
    allocations = relationship("SubjectAllocation", back_populates="section")
