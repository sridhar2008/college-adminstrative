from sqlalchemy import Column, String, Boolean, ForeignKey, Date
from sqlalchemy.orm import relationship as orm_relationship
from app.models.base import BaseModel


class Student(BaseModel):
    __tablename__ = "students"

    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    roll_number = Column(String(50), unique=True, nullable=False, index=True)
    registration_number = Column(String(50), unique=True, nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    program_id = Column(String(36), ForeignKey("programs.id"), nullable=False)
    batch_id = Column(String(36), ForeignKey("batches.id"), nullable=False)
    current_semester_id = Column(String(36), ForeignKey("semesters.id"), nullable=False)
    section_id = Column(String(36), ForeignKey("sections.id"), nullable=False)
    
    dob = Column(Date, nullable=False)
    gender = Column(String(20), nullable=False)
    blood_group = Column(String(10), nullable=True)
    college_email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    profile_image_url = Column(String(255), nullable=True)
    residential_address = Column(String(500), nullable=True)
    admission_status = Column(String(30), default="CONFIRMED", nullable=False)  # CONFIRMED, PROVISIONAL
    academic_status = Column(String(30), default="ACTIVE", nullable=False)      # ACTIVE, SUSPENDED, GRADUATED
    admission_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    user = orm_relationship("User", back_populates="student_profile")
    batch = orm_relationship("Batch", back_populates="students")
    section = orm_relationship("Section", back_populates="students")
    parents_guardians = orm_relationship("ParentGuardian", back_populates="student")
    contacts = orm_relationship("StudentContact", back_populates="student")
    enrollments = orm_relationship("StudentEnrollment", back_populates="student")
    attendance_records = orm_relationship("AttendanceRecord", back_populates="student")
    marks = orm_relationship("Mark", back_populates="student")
    results = orm_relationship("ExaminationResult", back_populates="student")


class ParentGuardian(BaseModel):
    __tablename__ = "parents_guardians"

    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)  # Optional linked parent user account
    relation_type = Column(String(20), nullable=False)  # FATHER, MOTHER, GUARDIAN
    full_name = Column(String(150), nullable=False)
    occupation = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=True)
    address = Column(String(500), nullable=True)
    is_primary_contact = Column(Boolean, default=True, nullable=False)

    student = orm_relationship("Student", back_populates="parents_guardians")
    user = orm_relationship("User", back_populates="parent_profile")


class StudentContact(BaseModel):
    __tablename__ = "student_contacts"

    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    category = Column(String(30), nullable=False)  # PARENT, GUARDIAN, EMERGENCY, FRIEND, FACULTY, DEPT_OFFICE, ADMIN_OFFICE
    name = Column(String(150), nullable=False)
    relationship = Column(String(50), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=True)
    is_public_in_directory = Column(Boolean, default=False, nullable=False)  # Explicit consent required for directory
    notes = Column(String(255), nullable=True)

    student = orm_relationship("Student", back_populates="contacts")
