from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.academic import Department, Program
from app.models.student import Student
from app.models.faculty import Faculty
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("")
def get_departments(db: Session = Depends(get_db)):
    """Retrieve all active academic departments and their offered programs."""
    departments = db.query(Department).filter(Department.is_active == True).all()
    results = []
    for d in departments:
        programs = db.query(Program).filter(Program.department_id == d.id).all()
        results.append({
            "id": d.id,
            "code": d.code,
            "name": d.name,
            "established_year": d.established_year,
            "programs": [
                {
                    "id": p.id,
                    "code": p.code,
                    "name": p.name,
                    "degree_level": p.degree_level,
                    "duration_years": p.duration_years,
                    "total_semesters": p.total_semesters
                } for p in programs
            ]
        })
    return results


@router.get("/stats")
def get_institution_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Institution analytics summary for Dean and Admin dashboards.
    Breaks down enrollment by Degree Level (UG, PG, PhD) and Department.
    """
    total_students = db.query(Student).count()
    total_faculty = db.query(Faculty).count()
    total_departments = db.query(Department).count()

    dept_stats = []
    for d in db.query(Department).all():
        student_count = db.query(Student).filter(Student.department_id == d.id).count()
        faculty_count = db.query(Faculty).filter(Faculty.department_id == d.id).count()
        dept_stats.append({
            "department_code": d.code,
            "department_name": d.name,
            "student_count": student_count,
            "faculty_count": faculty_count
        })

    # Degree level breakdown
    ug_count = db.query(Student).join(Program).filter(Program.degree_level == "UG").count()
    pg_count = db.query(Student).join(Program).filter(Program.degree_level == "PG").count()
    phd_count = db.query(Student).join(Program).filter(Program.degree_level == "PhD").count()

    return {
        "total_students": total_students,
        "total_faculty": total_faculty,
        "total_departments": total_departments,
        "degree_breakdown": {
            "UG": ug_count,
            "PG": pg_count,
            "PhD": phd_count
        },
        "department_statistics": dept_stats
    }
