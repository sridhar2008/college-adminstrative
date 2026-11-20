from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.student import Student
from app.models.academic import Department, Program, Batch, Section, Semester
from app.models.attendance import AttendanceRecord, AttendanceSession
from app.models.assessment import Mark
from app.models.curriculum import Subject
from app.models.audit import AuditLog

router = APIRouter()


@router.get("/lookup/{roll_number}")
def lookup_student_by_roll_number(
    roll_number: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search student by Roll Number with strict server-side authorization:
    - Dean / Admin: Can view any student in the college.
    - HOD: Can view students in their assigned department.
    - Faculty: Can view students enrolled in their assigned classes.
    - Student: Can view only their own record.
    - Parent: Can view only their linked ward.
    """
    roll_clean = roll_number.strip().upper()
    student = db.query(Student).filter(Student.roll_number.ilike(roll_clean)).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with roll number '{roll_number}' was not found in institutional records."
        )

    # Enforce Object-Level Access Control
    user_role = current_user.role.name if current_user.role else "student"

    if user_role == "student":
        if not current_user.student_profile or current_user.student_profile.id != student.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security Violation: You are not authorized to access another student's confidential profile."
            )
    elif user_role == "parent":
        linked_student_ids = [pg.student_id for pg in current_user.student_profile.parents_guardians] if current_user.student_profile else []
        # Check parents_guardians table linked to parent's user_id
        parent_records = [pg.student_id for pg in student.parents_guardians if pg.user_id == current_user.id]
        if not parent_records:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security Violation: You can only access academic details of your verified ward."
            )
    elif user_role == "hod":
        if current_user.faculty_profile and current_user.faculty_profile.department_id != student.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Department HOD can only access students enrolled within their own department."
            )

    # Log access in audit trail for compliance
    audit = AuditLog(
        user_id=current_user.id,
        action="LOOKUP_STUDENT",
        entity_type="STUDENT",
        entity_id=student.id
    )
    db.add(audit)
    db.commit()

    # Calculate overall attendance summary
    total_records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student.id).count()
    attended_records = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == student.id,
        AttendanceRecord.status.in_(["PRESENT", "ON_DUTY"])
    ).count()

    attendance_pct = round((attended_records / total_records * 100), 1) if total_records > 0 else 100.0

    # Retrieve subject-wise marks
    marks_records = db.query(Mark).filter(Mark.student_id == student.id, Mark.is_approved == True).all()
    marks_data = []
    for m in marks_records:
        marks_data.append({
            "subject_code": m.subject.code if m.subject else "",
            "subject_name": m.subject.name if m.subject else "",
            "assessment": m.assessment_type.name if m.assessment_type else "",
            "marks_obtained": m.marks_obtained,
            "max_marks": m.assessment_type.max_marks if m.assessment_type else 100.0
        })

    dept = db.query(Department).filter(Department.id == student.department_id).first()
    prog = db.query(Program).filter(Program.id == student.program_id).first()
    sec = db.query(Section).filter(Section.id == student.section_id).first()
    sem = db.query(Semester).filter(Semester.id == student.current_semester_id).first()

    return {
        "found": True,
        "student": {
            "id": student.id,
            "roll_number": student.roll_number,
            "registration_number": student.registration_number,
            "full_name": student.user.full_name if student.user else "Unknown",
            "college_email": student.college_email,
            "phone": student.phone if user_role in ["dean", "admin", "hod"] or (user_role == "student" and current_user.id == student.user_id) else None,
            "department_id": student.department_id,
            "department_name": dept.name if dept else "N/A",
            "program_name": prog.name if prog else "N/A",
            "degree_level": prog.degree_level if prog else "UG",
            "semester_number": sem.number if sem else 1,
            "section_name": sec.name if sec else "A",
            "admission_status": student.admission_status,
            "academic_status": student.academic_status,
            "admission_date": str(student.admission_date)
        },
        "attendance_summary": {
            "conducted_classes": total_records,
            "attended_classes": attended_records,
            "percentage": attendance_pct,
            "shortage_alert": attendance_pct < 75.0
        },
        "recent_marks": marks_data
    }


@router.get("")
def list_students(
    department_id: Optional[str] = None,
    program_id: Optional[str] = None,
    batch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List students with department, program, and batch filters."""
    query = db.query(Student)

    user_role = current_user.role.name if current_user.role else ""
    if user_role == "hod" and current_user.faculty_profile:
        query = query.filter(Student.department_id == current_user.faculty_profile.department_id)
    elif department_id:
        query = query.filter(Student.department_id == department_id)

    if program_id:
        query = query.filter(Student.program_id == program_id)
    if batch_id:
        query = query.filter(Student.batch_id == batch_id)

    students = query.limit(100).all()

    result = []
    for s in students:
        dept = db.query(Department).filter(Department.id == s.department_id).first()
        prog = db.query(Program).filter(Program.id == s.program_id).first()
        sec = db.query(Section).filter(Section.id == s.section_id).first()
        sem = db.query(Semester).filter(Semester.id == s.current_semester_id).first()
        result.append({
            "id": s.id,
            "roll_number": s.roll_number,
            "registration_number": s.registration_number,
            "full_name": s.user.full_name if s.user else "",
            "college_email": s.college_email,
            "department_name": dept.name if dept else "",
            "program_name": prog.name if prog else "",
            "degree_level": prog.degree_level if prog else "UG",
            "semester_number": sem.number if sem else 1,
            "section_name": sec.name if sec else "A",
            "academic_status": s.academic_status
        })
    return result
