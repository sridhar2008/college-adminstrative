import csv
import io
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.student import Student
from app.models.academic import Department, Program, Section, Semester
from app.models.attendance import AttendanceRecord
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/low-attendance")
def get_low_attendance_report(
    threshold: float = 75.0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate list of students with attendance shortage below threshold percentage."""
    students = db.query(Student).all()
    shortage_list = []

    for s in students:
        total = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == s.id).count()
        if total == 0:
            continue
        attended = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == s.id,
            AttendanceRecord.status.in_(["PRESENT", "ON_DUTY"])
        ).count()
        pct = round((attended / total * 100), 1)

        if pct < threshold:
            dept = db.query(Department).filter(Department.id == s.department_id).first()
            prog = db.query(Program).filter(Program.id == s.program_id).first()
            shortage_list.append({
                "student_id": s.id,
                "roll_number": s.roll_number,
                "full_name": s.user.full_name if s.user else "",
                "department_name": dept.name if dept else "",
                "program_name": prog.name if prog else "",
                "conducted_classes": total,
                "attended_classes": attended,
                "attendance_percentage": pct
            })

    return shortage_list


@router.get("/students/export-csv")
def export_students_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export authorized student records as CSV spreadsheet."""
    students = db.query(Student).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Roll Number", "Registration Number", "Student Name", "Email",
        "Department", "Program", "Degree Level", "Admission Date", "Status"
    ])

    for s in students:
        dept = db.query(Department).filter(Department.id == s.department_id).first()
        prog = db.query(Program).filter(Program.id == s.program_id).first()
        writer.writerow([
            s.roll_number,
            s.registration_number,
            s.user.full_name if s.user else "",
            s.college_email,
            dept.name if dept else "",
            prog.name if prog else "",
            prog.degree_level if prog else "UG",
            str(s.admission_date),
            s.academic_status
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=csms_student_registry.csv"}
    )
