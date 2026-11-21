from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.academic import AcademicYear, Semester, Batch, Section, Department, Program
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.user import User, Role
from app.api.deps import get_current_user, RoleChecker
from app.core.security import get_password_hash
from app.services.student_generator import generate_fictional_students, clear_generated_sample_students, ensure_departments_and_programs

router = APIRouter()


class ResetUserPasswordRequest(BaseModel):
    user_id: Optional[str] = None
    username_or_email: Optional[str] = None
    new_password: str


class BulkPasswordResetRequest(BaseModel):
    target_group: str  # "ALL", "STUDENTS", "FACULTY", "STAFF"
    default_password: str


class GenerateStudentsRequest(BaseModel):
    department_id: Optional[str] = "all"
    degree_level: str = "ALL"       # "ALL", "UG", "PG", "PhD"
    target_year: str = "ALL"        # "ALL", "1", "2", "3", "4"
    count_per_group: int = 50
    phd_years: int = 3


class AcademicYearCreate(BaseModel):
    code: str
    start_date: str
    end_date: str
    is_current: bool = False


@router.get("/academic-structure")
def get_academic_structure(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve active academic years, semesters, batches, and sections."""
    years = db.query(AcademicYear).all()
    batches = db.query(Batch).all()
    semesters = db.query(Semester).all()

    return {
        "academic_years": [
            {"id": y.id, "code": y.code, "is_current": y.is_current, "start_date": str(y.start_date), "end_date": str(y.end_date)} for y in years
        ],
        "semesters": [
            {"id": s.id, "academic_year_id": s.academic_year_id, "number": s.number, "semester_type": s.semester_type, "is_active": s.is_active} for s in semesters
        ],
        "batches": [
            {"id": b.id, "program_id": b.program_id, "name": b.batch_name, "admission_year": b.admission_year, "graduation_year": b.graduation_year} for b in batches
        ]
    }


@router.post("/generate-students")
def api_generate_students(
    req: GenerateStudentsRequest,
    current_user: User = Depends(RoleChecker(["admin", "dean"])),
    db: Session = Depends(get_db)
):
    """
    On-Demand Student Generator:
    Generates fictional student profiles with parent details, contacts, and user accounts.
    Allows targeting all or specific departments, programs (UG, PG, PhD), and academic years.
    """
    try:
        result = generate_fictional_students(
            db=db,
            department_id=req.department_id,
            degree_level=req.degree_level,
            target_year=req.target_year,
            count_per_group=req.count_per_group,
            phd_years=req.phd_years
        )
        return {
            "success": True,
            "message": f"Successfully generated {result['students_created']} students across {result['departments_covered']} departments.",
            "data": result
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Student generation failed: {str(e)}"
        )


@router.post("/clear-sample-students")
def api_clear_sample_students(
    current_user: User = Depends(RoleChecker(["admin", "dean"])),
    db: Session = Depends(get_db)
):
    """
    Safely resets generated fictional sample students while protecting primary demo accounts
    (2024CS101, 2023CS205, Dean, HODs, Professors).
    """
    try:
        deleted_count = clear_generated_sample_students(db)
        return {
            "success": True,
            "message": f"Successfully cleared {deleted_count} sample student records.",
            "deleted_count": deleted_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing sample students: {str(e)}"
        )


@router.get("/generator-stats")
def get_generator_stats(
    current_user: User = Depends(RoleChecker(["admin", "dean", "hod"])),
    db: Session = Depends(get_db)
):
    """Returns enrollment counts broken down by department, degree level, and year."""
    departments = db.query(Department).all()
    stats = []

    for d in departments:
        ug_count = db.query(Student).join(Program).filter(
            Student.department_id == d.id,
            Program.degree_level == "UG"
        ).count()

        pg_count = db.query(Student).join(Program).filter(
            Student.department_id == d.id,
            Program.degree_level == "PG"
        ).count()

        phd_count = db.query(Student).join(Program).filter(
            Student.department_id == d.id,
            Program.degree_level == "PhD"
        ).count()

        total = ug_count + pg_count + phd_count

        stats.append({
            "department_id": d.id,
            "department_code": d.code,
            "department_name": d.name,
            "ug_students": ug_count,
            "pg_students": pg_count,
            "phd_scholars": phd_count,
            "total_students": total
        })

    total_all = db.query(Student).count()
    return {
        "departments": stats,
        "total_college_students": total_all
    }


@router.get("/users-credentials")
def list_college_users_credentials(
    role_filter: Optional[str] = "all",
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(RoleChecker(["admin", "dean"])),
    db: Session = Depends(get_db)
):
    """
    List college members (Students, Faculty, HODs, Deans, Staff)
    with their usernames, roles, and status for institutional credential governance.
    """
    query = db.query(User).join(Role, User.role_id == Role.id)

    if role_filter and role_filter != "all":
        query = query.filter(Role.name.ilike(role_filter))

    if search:
        s_clean = f"%{search.strip()}%"
        query = query.filter(
            (User.username.ilike(s_clean)) |
            (User.email.ilike(s_clean)) |
            (User.full_name.ilike(s_clean))
        )

    total = query.count()
    users = query.order_by(Role.name.asc(), User.username.asc()).offset(offset).limit(limit).all()

    items = []
    for u in users:
        roll_or_emp = u.username
        dept_name = "College Administration"
        if u.student_profile:
            roll_or_emp = u.student_profile.roll_number
            dept = db.query(Department).filter(Department.id == u.student_profile.department_id).first()
            dept_name = dept.name if dept else "Engineering"
        elif u.faculty_profile:
            roll_or_emp = u.faculty_profile.employee_id
            dept = db.query(Department).filter(Department.id == u.faculty_profile.department_id).first()
            dept_name = dept.name if dept else "Engineering"

        items.append({
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role.name if u.role else "user",
            "role_display": u.role.display_name if u.role else "User",
            "identifier": roll_or_emp,
            "department_name": dept_name,
            "is_active": u.is_active
        })

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.post("/reset-user-password")
def reset_single_user_password(
    req: ResetUserPasswordRequest,
    current_user: User = Depends(RoleChecker(["admin", "dean"])),
    db: Session = Depends(get_db)
):
    """Reset individual password for any student, faculty, or staff member."""
    query = db.query(User)
    if req.user_id:
        user = query.filter(User.id == req.user_id).first()
    elif req.username_or_email:
        clean = req.username_or_email.strip()
        user = query.filter((User.username.ilike(clean)) | (User.email.ilike(clean))).first()
    else:
        raise HTTPException(status_code=400, detail="Must provide user_id or username_or_email.")

    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    user.hashed_password = get_password_hash(req.new_password)
    user.is_active = True
    db.commit()

    return {
        "success": True,
        "message": f"Password for {user.full_name} ({user.username}) has been updated successfully.",
        "username": user.username,
        "email": user.email
    }


@router.post("/bulk-reset-passwords")
def bulk_reset_passwords(
    req: BulkPasswordResetRequest,
    current_user: User = Depends(RoleChecker(["admin", "dean"])),
    db: Session = Depends(get_db)
):
    """
    Standardize or reset passwords across an entire cohort
    (e.g., all 9,000 students to 'Student@123' or all faculty to 'Faculty@123').
    """
    if len(req.default_password) < 6:
        raise HTTPException(status_code=400, detail="Default password must be at least 6 characters.")

    hashed = get_password_hash(req.default_password)
    query = db.query(User).join(Role, User.role_id == Role.id)

    target = req.target_group.upper()
    if target == "STUDENTS":
        query = query.filter(Role.name == "student")
    elif target == "FACULTY":
        query = query.filter(Role.name.in_(["faculty", "subject_faculty", "guest", "hod"]))
    elif target == "STAFF":
        query = query.filter(Role.name.in_(["admin", "staff", "parent"]))
    elif target == "ALL":
        pass  # all members
    else:
        raise HTTPException(status_code=400, detail=f"Invalid target group: {target}")

    users = query.all()
    count = 0
    for u in users:
        u.hashed_password = hashed
        u.is_active = True
        count += 1

    db.commit()

    return {
        "success": True,
        "message": f"Successfully updated and enabled passwords for {count} college members ({target}).",
        "affected_count": count,
        "default_password": req.default_password
    }
