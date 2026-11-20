from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.faculty import Faculty, SubjectAllocation
from app.models.curriculum import Subject
from app.models.academic import Section, Semester
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()


@router.get("")
def list_faculty(db: Session = Depends(get_db)):
    """List all faculty members and designations."""
    faculties = db.query(Faculty).all()
    results = []
    for f in faculties:
        results.append({
            "id": f.id,
            "employee_id": f.employee_id,
            "full_name": f.user.full_name if f.user else "",
            "department_name": f.department.name if f.department else "",
            "designation": f.designation,
            "qualification": f.qualification,
            "specialization": f.specialization,
            "is_hod": f.is_hod
        })
    return results


@router.get("/my-allocations")
def get_faculty_allocations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve subjects and sections allocated to the logged-in faculty."""
    if not current_user.faculty_profile:
        return []

    allocations = db.query(SubjectAllocation).filter(
        SubjectAllocation.faculty_id == current_user.faculty_profile.id
    ).all()

    results = []
    for a in allocations:
        results.append({
            "allocation_id": a.id,
            "subject_id": a.subject.id if a.subject else "",
            "subject_code": a.subject.code if a.subject else "",
            "subject_name": a.subject.name if a.subject else "",
            "credits": a.subject.credits if a.subject else 3,
            "section_name": a.section.name if a.section else "",
            "semester_number": a.semester.number if a.semester else 1
        })
    return results
