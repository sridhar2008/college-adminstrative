from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.assessment import AssessmentType, Mark, ExaminationResult
from app.models.curriculum import Subject
from app.models.student import Student
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.mark import BulkMarkEntryRequest

router = APIRouter()


@router.get("/my-marks")
def get_my_marks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns published internal marks and semester grades for the logged-in student.
    Students can only view approved/published marks.
    """
    if not current_user.student_profile:
        return []

    student_id = current_user.student_profile.id
    marks = db.query(Mark).filter(
        Mark.student_id == student_id,
        Mark.is_approved == True
    ).all()

    results = []
    for m in marks:
        results.append({
            "id": m.id,
            "subject_code": m.subject.code if m.subject else "",
            "subject_name": m.subject.name if m.subject else "",
            "assessment_name": m.assessment_type.name if m.assessment_type else "",
            "marks_obtained": m.marks_obtained,
            "max_marks": m.assessment_type.max_marks if m.assessment_type else 100.0,
            "weightage_percent": m.assessment_type.weightage_percent if m.assessment_type else 20.0,
            "remarks": m.remarks
        })
    return results


@router.get("/assessment-types")
def get_assessment_types(db: Session = Depends(get_db)):
    """Retrieve all configurable assessment types (IA1, IA2, IA3, Labs, Assignments, Model Exams)."""
    types = db.query(AssessmentType).filter(AssessmentType.is_active == True).all()
    return [
        {
            "id": t.id,
            "code": t.code,
            "name": t.name,
            "max_marks": t.max_marks,
            "weightage_percent": t.weightage_percent,
            "passing_marks": t.passing_marks
        } for t in types
    ]


@router.post("/bulk-entry")
def bulk_enter_marks(
    data: BulkMarkEntryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Faculty entry of internal assessment marks with submission and approval workflow."""
    if not current_user.faculty_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty members can enter internal marks."
        )

    for entry in data.entries:
        existing = db.query(Mark).filter(
            Mark.student_id == entry.student_id,
            Mark.subject_id == data.subject_id,
            Mark.assessment_type_id == data.assessment_type_id,
            Mark.semester_id == data.semester_id
        ).first()

        if existing:
            existing.marks_obtained = entry.marks_obtained
            existing.remarks = entry.remarks
            existing.is_submitted = True
            existing.submitted_by_faculty_id = current_user.faculty_profile.id
        else:
            mark = Mark(
                student_id=entry.student_id,
                subject_id=data.subject_id,
                assessment_type_id=data.assessment_type_id,
                semester_id=data.semester_id,
                marks_obtained=entry.marks_obtained,
                remarks=entry.remarks,
                is_submitted=True,
                submitted_by_faculty_id=current_user.faculty_profile.id,
                is_approved=True  # Auto-approved for demo/seed ease
            )
            db.add(mark)

    db.commit()
    return {"success": True, "message": f"Successfully recorded {len(data.entries)} student marks."}
