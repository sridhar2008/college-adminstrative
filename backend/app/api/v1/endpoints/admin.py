from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.academic import AcademicYear, Semester, Batch, Section, Department, Program
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.user import User
from app.api.deps import get_current_user, RoleChecker
from app.services.student_generator import generate_fictional_students, clear_generated_sample_students, ensure_departments_and_programs

router = APIRouter()


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
