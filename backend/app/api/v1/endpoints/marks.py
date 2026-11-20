from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.assessment import AssessmentType, Mark, ExaminationResult, GradingRule
from app.models.curriculum import Subject
from app.models.student import Student
from app.models.academic import Semester, Department, Program
from app.models.user import User
from app.models.audit import AuditLog
from app.api.deps import get_current_user, RoleChecker
from app.schemas.mark import BulkMarkEntryRequest

router = APIRouter()


class GradingRuleCreate(BaseModel):
    grade_letter: str
    min_score: float
    max_score: float
    grade_point: float
    description: Optional[str] = None


class ApproveMarksRequest(BaseModel):
    subject_id: str
    assessment_type_id: str
    semester_id: str


class PublishResultsRequest(BaseModel):
    semester_id: str
    department_id: Optional[str] = "all"


DEFAULT_GRADING_RULES = [
    ("O", 90.0, 100.0, 10.0, "Outstanding"),
    ("A+", 80.0, 89.99, 9.0, "Excellent"),
    ("A", 70.0, 79.99, 8.0, "Very Good"),
    ("B+", 60.0, 69.99, 7.0, "Good"),
    ("B", 50.0, 59.99, 6.0, "Above Average"),
    ("RA", 0.0, 49.99, 0.0, "Re-appear / Fail")
]


def calculate_grade(score: float, rules: List[GradingRule]) -> tuple:
    """Returns (grade_letter, grade_point) based on configurable grading rules."""
    for r in rules:
        if r.min_score <= score <= r.max_score:
            return (r.grade_letter, r.grade_point)
    return ("RA", 0.0)


@router.get("/grading-rules")
def get_grading_rules(db: Session = Depends(get_db)):
    """Retrieve active institutional grading rules."""
    rules = db.query(GradingRule).order_by(GradingRule.grade_point.desc()).all()
    if not rules:
        # Auto-seed default rules if not initialized
        for letter, min_s, max_s, gp, desc in DEFAULT_GRADING_RULES:
            gr = GradingRule(
                grade_letter=letter,
                min_score=min_s,
                max_score=max_s,
                grade_point=gp,
                description=desc,
                is_active=True
            )
            db.add(gr)
        db.commit()
        rules = db.query(GradingRule).order_by(GradingRule.grade_point.desc()).all()

    return [
        {
            "id": r.id,
            "grade_letter": r.grade_letter,
            "min_score": r.min_score,
            "max_score": r.max_score,
            "grade_point": r.grade_point,
            "description": r.description
        } for r in rules
    ]


@router.post("/grading-rules")
def create_or_update_grading_rule(
    data: GradingRuleCreate,
    current_user: User = Depends(RoleChecker(["admin", "dean"])),
    db: Session = Depends(get_db)
):
    """Admin configuration for institutional grading rules."""
    existing = db.query(GradingRule).filter(GradingRule.grade_letter == data.grade_letter.strip().upper()).first()
    if existing:
        existing.min_score = data.min_score
        existing.max_score = data.max_score
        existing.grade_point = data.grade_point
        existing.description = data.description
    else:
        rule = GradingRule(
            grade_letter=data.grade_letter.strip().upper(),
            min_score=data.min_score,
            max_score=data.max_score,
            grade_point=data.grade_point,
            description=data.description,
            is_active=True
        )
        db.add(rule)

    db.commit()
    return {"success": True, "message": "Grading rule saved successfully."}


@router.get("/my-marks")
def get_my_marks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns internal marks and published grades for the logged-in student or parent.
    Students and parents can only view officially published/approved records.
    """
    student_id = None
    if current_user.student_profile:
        student_id = current_user.student_profile.id
    elif current_user.role and current_user.role.name == "parent" and current_user.parent_profile:
        student_id = current_user.parent_profile.student_id

    if not student_id:
        return []

    rules = db.query(GradingRule).filter(GradingRule.is_active == True).all()

    marks = db.query(Mark).filter(
        Mark.student_id == student_id,
        Mark.is_approved == True
    ).all()

    results = []
    for m in marks:
        grade_letter, grade_point = calculate_grade(m.marks_obtained, rules)
        results.append({
            "id": m.id,
            "subject_code": m.subject.code if m.subject else "",
            "subject_name": m.subject.name if m.subject else "",
            "assessment_name": m.assessment_type.name if m.assessment_type else "",
            "marks_obtained": m.marks_obtained,
            "max_marks": m.assessment_type.max_marks if m.assessment_type else 100.0,
            "weightage_percent": m.assessment_type.weightage_percent if m.assessment_type else 20.0,
            "grade_letter": grade_letter,
            "grade_point": grade_point,
            "remarks": m.remarks or "Verified"
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


@router.get("/course-marks")
def get_course_marks(
    subject_id: str,
    assessment_type_id: str,
    semester_id: str,
    current_user: User = Depends(RoleChecker(["faculty", "subject_faculty", "hod", "dean", "admin"])),
    db: Session = Depends(get_db)
):
    """Retrieve marks entered for a subject and assessment type for faculty review and entry."""
    marks = db.query(Mark).filter(
        Mark.subject_id == subject_id,
        Mark.assessment_type_id == assessment_type_id,
        Mark.semester_id == semester_id
    ).all()

    return [
        {
            "id": m.id,
            "student_id": m.student_id,
            "roll_number": m.student.roll_number if m.student else "",
            "student_name": m.student.user.full_name if m.student and m.student.user else "",
            "marks_obtained": m.marks_obtained,
            "is_submitted": m.is_submitted,
            "is_approved": m.is_approved,
            "remarks": m.remarks
        } for m in marks
    ]


@router.post("/bulk-entry")
def bulk_enter_marks(
    data: BulkMarkEntryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Faculty entry or update of internal assessment marks."""
    if not current_user.faculty_profile and (current_user.role and current_user.role.name not in ["admin", "dean"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty members can enter internal marks."
        )

    faculty_id = current_user.faculty_profile.id if current_user.faculty_profile else None

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
            existing.submitted_by_faculty_id = faculty_id or existing.submitted_by_faculty_id
            existing.submitted_at = datetime.now(timezone.utc)
        else:
            mark = Mark(
                student_id=entry.student_id,
                subject_id=data.subject_id,
                assessment_type_id=data.assessment_type_id,
                semester_id=data.semester_id,
                marks_obtained=entry.marks_obtained,
                remarks=entry.remarks,
                is_submitted=True,
                submitted_by_faculty_id=faculty_id,
                submitted_at=datetime.now(timezone.utc),
                is_approved=False
            )
            db.add(mark)

    db.commit()
    return {"success": True, "message": f"Successfully saved marks for {len(data.entries)} students."}


@router.post("/approve-batch")
def approve_marks_batch(
    req: ApproveMarksRequest,
    current_user: User = Depends(RoleChecker(["hod", "dean", "admin"])),
    db: Session = Depends(get_db)
):
    """HOD review and approval of marks for publication."""
    faculty_id = current_user.faculty_profile.id if current_user.faculty_profile else None

    marks = db.query(Mark).filter(
        Mark.subject_id == req.subject_id,
        Mark.assessment_type_id == req.assessment_type_id,
        Mark.semester_id == req.semester_id
    ).all()

    for m in marks:
        m.is_approved = True
        m.approved_by_hod_id = faculty_id
        m.approved_at = datetime.now(timezone.utc)

    db.commit()
    return {"success": True, "message": f"Approved {len(marks)} student marks for subject."}


@router.post("/publish-semester-results")
def publish_semester_results(
    req: PublishResultsRequest,
    current_user: User = Depends(RoleChecker(["admin", "dean"])),
    db: Session = Depends(get_db)
):
    """
    Calculates GPA / CGPA based on credits and approved marks,
    and publishes semester results for students and parents to view.
    """
    rules = db.query(GradingRule).filter(GradingRule.is_active == True).all()

    query = db.query(Student).filter(Student.current_semester_id == req.semester_id)
    if req.department_id and req.department_id != "all":
        query = query.filter(Student.department_id == req.department_id)

    students = query.all()
    published_count = 0

    curr_sem = db.query(Semester).filter(Semester.id == req.semester_id).first()
    ay_id = curr_sem.academic_year_id if curr_sem else ""

    for s in students:
        marks = db.query(Mark).filter(
            Mark.student_id == s.id,
            Mark.semester_id == req.semester_id,
            Mark.is_approved == True
        ).all()

        total_credits = 0
        weighted_points = 0.0
        all_pass = True

        for m in marks:
            credits = m.subject.credits if m.subject else 3
            letter, point = calculate_grade(m.marks_obtained, rules)
            total_credits += credits
            weighted_points += (credits * point)
            if point == 0.0:
                all_pass = False

        gpa = round(weighted_points / total_credits, 2) if total_credits > 0 else 0.0

        existing_res = db.query(ExaminationResult).filter(
            ExaminationResult.student_id == s.id,
            ExaminationResult.semester_id == req.semester_id
        ).first()

        status_str = "PASS" if all_pass and total_credits > 0 else "FAIL"

        if existing_res:
            existing_res.total_credits = total_credits
            existing_res.gpa = gpa
            existing_res.cgpa = gpa  # Simplified to GPA for current semester
            existing_res.result_status = status_str
            existing_res.is_published = True
            existing_res.published_at = datetime.now(timezone.utc)
            existing_res.published_by_admin_id = current_user.id
        else:
            exam_res = ExaminationResult(
                student_id=s.id,
                semester_id=req.semester_id,
                academic_year_id=ay_id,
                total_credits=total_credits,
                gpa=gpa,
                cgpa=gpa,
                result_status=status_str,
                is_published=True,
                published_at=datetime.now(timezone.utc),
                published_by_admin_id=current_user.id
            )
            db.add(exam_res)

        published_count += 1

    db.commit()
    return {"success": True, "message": f"Successfully calculated and published results for {published_count} students.", "count": published_count}
