from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.academic import AcademicYear, Semester, Batch, Section
from app.models.user import User, Role
from app.api.deps import get_current_user, RoleChecker

router = APIRouter()


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
            {"id": y.id, "code": y.code, "is_current": y.is_current} for y in years
        ],
        "semesters": [
            {"id": s.id, "number": s.number, "semester_type": s.semester_type, "is_active": s.is_active} for s in semesters
        ],
        "batches": [
            {"id": b.id, "name": b.batch_name, "admission_year": b.admission_year, "graduation_year": b.graduation_year} for b in batches
        ]
    }
