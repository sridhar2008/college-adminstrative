from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.academic import Department, Program
from app.models.student import Student
from app.models.faculty import Faculty
from app.api.deps import get_current_user, RoleChecker
from app.models.user import User

router = APIRouter()


class DepartmentCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    established_year: Optional[int] = 2000


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    established_year: Optional[int] = None
    is_active: Optional[bool] = None


class ProgramCreate(BaseModel):
    name: str
    code: str
    degree_level: str       # UG, PG, PhD
    duration_years: int     # 4 for UG, 2 for PG, 3-5 for PhD
    total_semesters: int    # duration * 2


class ProgramUpdate(BaseModel):
    name: Optional[str] = None
    duration_years: Optional[int] = None
    total_semesters: Optional[int] = None
    is_active: Optional[bool] = None


@router.get("")
def get_departments(db: Session = Depends(get_db)):
    """Retrieve all active academic departments and their offered programs."""
    departments = db.query(Department).all()
    results = []
    for d in departments:
        programs = db.query(Program).filter(Program.department_id == d.id).all()
        student_count = db.query(Student).filter(Student.department_id == d.id).count()
        faculty_count = db.query(Faculty).filter(Faculty.department_id == d.id).count()
        results.append({
            "id": d.id,
            "code": d.code,
            "name": d.name,
            "description": d.description,
            "established_year": d.established_year,
            "is_active": d.is_active,
            "student_count": student_count,
            "faculty_count": faculty_count,
            "programs": [
                {
                    "id": p.id,
                    "code": p.code,
                    "name": p.name,
                    "degree_level": p.degree_level,
                    "duration_years": p.duration_years,
                    "total_semesters": p.total_semesters,
                    "is_active": p.is_active
                } for p in programs
            ]
        })
    return results


@router.post("")
def create_department(
    data: DepartmentCreate,
    current_user: User = Depends(RoleChecker(["admin", "dean"])),
    db: Session = Depends(get_db)
):
    """Add new academic department."""
    code = data.code.strip().upper()
    existing = db.query(Department).filter(Department.code.ilike(code)).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Department with code '{code}' already exists.")

    dept = Department(
        code=code,
        name=data.name.strip(),
        description=data.description,
        established_year=data.established_year,
        is_active=True
    )
    db.add(dept)
    db.flush()

    # Automatically create default UG program for convenience
    ug_prog = Program(
        department_id=dept.id,
        name=f"B.Tech {data.name.strip()}",
        code=f"BTECH-{code}",
        degree_level="UG",
        duration_years=4,
        total_semesters=8,
        is_active=True
    )
    db.add(ug_prog)
    db.commit()

    return {"success": True, "message": "Department created successfully.", "id": dept.id}


@router.put("/{department_id}")
def update_department(
    department_id: str,
    data: DepartmentUpdate,
    current_user: User = Depends(RoleChecker(["admin", "dean"])),
    db: Session = Depends(get_db)
):
    """Edit department metadata."""
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")

    if data.name:
        dept.name = data.name.strip()
    if data.description is not None:
        dept.description = data.description
    if data.established_year:
        dept.established_year = data.established_year
    if data.is_active is not None:
        dept.is_active = data.is_active

    db.commit()
    return {"success": True, "message": "Department updated successfully."}


@router.delete("/{department_id}")
def deactivate_department(
    department_id: str,
    current_user: User = Depends(RoleChecker(["admin", "dean"])),
    db: Session = Depends(get_db)
):
    """Deactivate department."""
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")

    dept.is_active = False
    db.commit()
    return {"success": True, "message": "Department deactivated."}


@router.post("/{department_id}/programs")
def add_program(
    department_id: str,
    data: ProgramCreate,
    current_user: User = Depends(RoleChecker(["admin", "dean"])),
    db: Session = Depends(get_db)
):
    """Add UG, PG, or PhD program to a department."""
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")

    code = data.code.strip().upper()
    existing = db.query(Program).filter(Program.code.ilike(code)).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Program code '{code}' is already registered.")

    prog = Program(
        department_id=dept.id,
        name=data.name.strip(),
        code=code,
        degree_level=data.degree_level,
        duration_years=data.duration_years,
        total_semesters=data.total_semesters or (data.duration_years * 2),
        is_active=True
    )
    db.add(prog)
    db.commit()

    return {"success": True, "message": "Program added successfully.", "id": prog.id}


@router.put("/programs/{program_id}")
def update_program(
    program_id: str,
    data: ProgramUpdate,
    current_user: User = Depends(RoleChecker(["admin", "dean"])),
    db: Session = Depends(get_db)
):
    """Update program duration, total semesters, or active state."""
    prog = db.query(Program).filter(Program.id == program_id).first()
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found.")

    if data.name:
        prog.name = data.name.strip()
    if data.duration_years:
        prog.duration_years = data.duration_years
        prog.total_semesters = data.total_semesters or (data.duration_years * 2)
    if data.is_active is not None:
        prog.is_active = data.is_active

    db.commit()
    return {"success": True, "message": "Program updated successfully."}


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
