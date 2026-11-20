"""
Central models package exposing all database entities for SQLAlchemy and Alembic.
"""

from app.models.base import BaseModel
from app.models.user import User, Role, Permission, role_permissions
from app.models.academic import Department, Program, AcademicYear, Semester, Batch, Section
from app.models.faculty import Faculty, Staff, SubjectAllocation
from app.models.curriculum import Subject, StudentEnrollment
from app.models.student import Student, ParentGuardian, StudentContact
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.assessment import AssessmentType, Mark, ExaminationResult, GradingRule
from app.models.communication import Notification, Announcement
from app.models.audit import ApprovalRecord, AuditLog

__all__ = [
    "BaseModel",
    "User",
    "Role",
    "Permission",
    "role_permissions",
    "Department",
    "Program",
    "AcademicYear",
    "Semester",
    "Batch",
    "Section",
    "Faculty",
    "Staff",
    "SubjectAllocation",
    "Subject",
    "StudentEnrollment",
    "Student",
    "ParentGuardian",
    "StudentContact",
    "AttendanceSession",
    "AttendanceRecord",
    "AssessmentType",
    "Mark",
    "ExaminationResult",
    "GradingRule",
    "Notification",
    "Announcement",
    "ApprovalRecord",
    "AuditLog"
]
