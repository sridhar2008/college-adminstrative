from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    students,
    departments,
    faculty,
    attendance,
    marks,
    contacts,
    notifications,
    reports,
    admin,
    audit
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Identity"])
api_router.include_router(students.router, prefix="/students", tags=["Student Profile Management"])
api_router.include_router(departments.router, prefix="/departments", tags=["Departments & Programs"])
api_router.include_router(faculty.router, prefix="/faculty", tags=["Faculty & Workload"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance Tracking"])
api_router.include_router(marks.router, prefix="/marks", tags=["Internal Assessments & Marks"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["Contact Diary & Consent"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications & Announcements"])
api_router.include_router(reports.router, prefix="/reports", tags=["Academic Reports & Analytics"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administrative Control"])
api_router.include_router(audit.router, prefix="/audit", tags=["Security Audit Trail"])
