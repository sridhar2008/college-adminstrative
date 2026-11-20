from typing import List, Optional
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.faculty import SubjectAllocation, Faculty
from app.models.student import Student
from app.models.curriculum import Subject
from app.models.academic import Section, Semester, Department
from app.models.user import User
from app.models.audit import ApprovalRecord, AuditLog
from app.api.deps import get_current_user, RoleChecker
from app.schemas.attendance import AttendanceSessionCreate, StudentSubjectAttendanceSummary

router = APIRouter()


class AttendanceCorrectionCreate(BaseModel):
    session_id: str
    student_id: str
    requested_status: str  # PRESENT, ON_DUTY, MEDICAL_LEAVE
    reason: str


class CorrectionApprovalRequest(BaseModel):
    status: str            # APPROVED, REJECTED
    comments: Optional[str] = None


@router.get("/my-summary", response_model=List[StudentSubjectAttendanceSummary])
def get_student_attendance_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns subject-wise attendance calculation for the logged-in student:
    Attendance Percentage = (Number of Classes Attended / Total Conducted Classes) * 100
    Highlights low attendance warnings if < 75%.
    """
    student_id = None
    if current_user.student_profile:
        student_id = current_user.student_profile.id
    elif current_user.role and current_user.role.name == "parent" and current_user.parent_profile:
        student_id = current_user.parent_profile.student_id

    if not student_id:
        return []

    records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student_id).all()

    subject_map = {}
    for r in records:
        session = r.session
        if not session or not session.subject_allocation:
            continue
        subj = session.subject_allocation.subject
        if not subj:
            continue

        if subj.id not in subject_map:
            subject_map[subj.id] = {
                "subject_code": subj.code,
                "subject_name": subj.name,
                "conducted": 0,
                "attended": 0
            }

        subject_map[subj.id]["conducted"] += 1
        if r.status in ["PRESENT", "ON_DUTY"]:
            subject_map[subj.id]["attended"] += 1

    summaries = []
    for s_id, data in subject_map.items():
        pct = round((data["attended"] / data["conducted"] * 100), 1) if data["conducted"] > 0 else 100.0
        summaries.append(StudentSubjectAttendanceSummary(
            subject_code=data["subject_code"],
            subject_name=data["subject_name"],
            conducted_classes=data["conducted"],
            attended_classes=data["attended"],
            percentage=pct,
            status_alert=pct < 75.0
        ))
    return summaries


@router.get("/classes")
def get_faculty_assigned_classes(
    current_user: User = Depends(RoleChecker(["faculty", "subject_faculty", "guest", "hod", "dean", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Returns allocated classes for attendance marking with enrolled student rosters.
    """
    user_role = current_user.role.name if current_user.role else ""
    query = db.query(SubjectAllocation)

    if user_role in ["faculty", "subject_faculty", "guest"] and current_user.faculty_profile:
        query = query.filter(SubjectAllocation.faculty_id == current_user.faculty_profile.id)
    elif user_role == "hod" and current_user.faculty_profile:
        query = query.join(Subject).filter(Subject.department_id == current_user.faculty_profile.department_id)

    allocations = query.all()
    results = []

    for a in allocations:
        # Enrolled students in this section/semester
        students = db.query(Student).filter(
            Student.section_id == a.section_id,
            Student.academic_status == "ACTIVE"
        ).order_by(Student.roll_number.asc()).limit(60).all()

        results.append({
            "allocation_id": a.id,
            "subject_id": a.subject.id if a.subject else "",
            "subject_code": a.subject.code if a.subject else "",
            "subject_name": a.subject.name if a.subject else "",
            "section_name": a.section.name if a.section else "A",
            "semester_number": a.semester.number if a.semester else 1,
            "students": [
                {
                    "id": s.id,
                    "roll_number": s.roll_number,
                    "full_name": s.user.full_name if s.user else "Student"
                } for s in students
            ]
        })

    return results


@router.get("/sessions")
def list_attendance_sessions(
    allocation_id: Optional[str] = None,
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List recent attendance sessions with present/absent counts."""
    query = db.query(AttendanceSession)
    if allocation_id:
        query = query.filter(AttendanceSession.subject_allocation_id == allocation_id)

    sessions = query.order_by(AttendanceSession.session_date.desc(), AttendanceSession.period_number.desc()).limit(limit).all()

    items = []
    for s in sessions:
        present_count = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == s.id,
            AttendanceRecord.status.in_(["PRESENT", "ON_DUTY"])
        ).count()
        total_count = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == s.id).count()

        items.append({
            "id": s.id,
            "allocation_id": s.subject_allocation_id,
            "subject_code": s.subject_allocation.subject.code if s.subject_allocation and s.subject_allocation.subject else "",
            "subject_name": s.subject_allocation.subject.name if s.subject_allocation and s.subject_allocation.subject else "",
            "section_name": s.subject_allocation.section.name if s.subject_allocation and s.subject_allocation.section else "A",
            "session_date": str(s.session_date),
            "period_number": s.period_number,
            "topic_covered": s.topic_covered,
            "present_count": present_count,
            "total_count": total_count,
            "attendance_rate": round(present_count / total_count * 100, 1) if total_count > 0 else 0
        })
    return items


@router.post("/sessions")
def create_attendance_session(
    data: AttendanceSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record attendance for a class session.
    Prevents duplicate entries for the same subject allocation, date, and period.
    """
    if not current_user.faculty_profile and (current_user.role and current_user.role.name not in ["admin", "dean"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty members can record attendance."
        )

    existing = db.query(AttendanceSession).filter(
        AttendanceSession.subject_allocation_id == data.subject_allocation_id,
        AttendanceSession.session_date == data.session_date,
        AttendanceSession.period_number == data.period_number
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Attendance session already exists for date {data.session_date} and period {data.period_number}."
        )

    faculty_id = current_user.faculty_profile.id if current_user.faculty_profile else None
    if not faculty_id:
        alloc = db.query(SubjectAllocation).filter(SubjectAllocation.id == data.subject_allocation_id).first()
        faculty_id = alloc.faculty_id if alloc else None

    session = AttendanceSession(
        subject_allocation_id=data.subject_allocation_id,
        session_date=data.session_date,
        period_number=data.period_number,
        topic_covered=data.topic_covered or f"Period {data.period_number} Lecture",
        conducted_by_faculty_id=faculty_id or current_user.id
    )
    db.add(session)
    db.flush()

    for rec in data.records:
        record = AttendanceRecord(
            session_id=session.id,
            student_id=rec.student_id,
            status=rec.status,
            remarks=rec.remarks
        )
        db.add(record)

    db.commit()
    return {"success": True, "message": f"Recorded attendance for {len(data.records)} students.", "session_id": session.id}


@router.post("/correction-request")
def request_attendance_correction(
    req: AttendanceCorrectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit attendance correction request for HOD review."""
    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == req.session_id,
        AttendanceRecord.student_id == req.student_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Original attendance record not found.")

    approval = ApprovalRecord(
        entity_type="ATTENDANCE_CORRECTION",
        entity_id=record.id,
        requested_by_user_id=current_user.id,
        status="PENDING",
        comments=f"Requested Status: {req.requested_status}. Reason: {req.reason}"
    )
    db.add(approval)
    db.commit()

    return {"success": True, "message": "Correction request submitted for HOD review."}


@router.get("/correction-requests")
def get_correction_requests(
    current_user: User = Depends(RoleChecker(["hod", "dean", "admin"])),
    db: Session = Depends(get_db)
):
    """Retrieve pending attendance correction requests for HOD/Dean."""
    requests = db.query(ApprovalRecord).filter(
        ApprovalRecord.entity_type == "ATTENDANCE_CORRECTION"
    ).order_by(ApprovalRecord.created_at.desc()).limit(50).all()

    items = []
    for r in requests:
        rec = db.query(AttendanceRecord).filter(AttendanceRecord.id == r.entity_id).first()
        student = rec.student if rec else None
        user_req = db.query(User).filter(User.id == r.requested_by_user_id).first()

        items.append({
            "id": r.id,
            "entity_id": r.entity_id,
            "student_roll": student.roll_number if student else "N/A",
            "student_name": student.user.full_name if student and student.user else "N/A",
            "requested_by": user_req.full_name if user_req else "User",
            "current_status": rec.status if rec else "N/A",
            "comments": r.comments,
            "status": r.status,
            "created_at": str(r.created_at)
        })
    return items


@router.patch("/correction-requests/{request_id}")
def resolve_correction_request(
    request_id: str,
    action: CorrectionApprovalRequest,
    current_user: User = Depends(RoleChecker(["hod", "dean", "admin"])),
    db: Session = Depends(get_db)
):
    """Approve or reject an attendance correction request."""
    req = db.query(ApprovalRecord).filter(ApprovalRecord.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Correction request not found.")

    req.status = action.status
    req.reviewed_by_user_id = current_user.id
    req.resolved_at = datetime.now(timezone.utc)

    if action.status == "APPROVED":
        rec = db.query(AttendanceRecord).filter(AttendanceRecord.id == req.entity_id).first()
        if rec:
            # Extract requested status
            if "PRESENT" in req.comments:
                rec.status = "PRESENT"
            elif "ON_DUTY" in req.comments:
                rec.status = "ON_DUTY"
            elif "MEDICAL_LEAVE" in req.comments:
                rec.status = "MEDICAL_LEAVE"

    db.commit()
    return {"success": True, "message": f"Request {action.status.lower()} successfully."}


@router.get("/reports/department")
def get_department_attendance_summary(
    department_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Department-wide attendance statistics and low-attendance percentage."""
    query = db.query(Department)
    if department_id and department_id != "all":
        query = query.filter(Department.id == department_id)

    departments = query.all()
    stats = []

    for d in departments:
        students = db.query(Student).filter(Student.department_id == d.id).all()
        student_count = len(students)
        low_count = 0
        total_pct_sum = 0.0

        for s in students:
            total = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == s.id).count()
            if total > 0:
                attended = db.query(AttendanceRecord).filter(
                    AttendanceRecord.student_id == s.id,
                    AttendanceRecord.status.in_(["PRESENT", "ON_DUTY"])
                ).count()
                pct = (attended / total) * 100
                total_pct_sum += pct
                if pct < 75.0:
                    low_count += 1
            else:
                total_pct_sum += 100.0

        avg_pct = round(total_pct_sum / student_count, 1) if student_count > 0 else 100.0

        stats.append({
            "department_code": d.code,
            "department_name": d.name,
            "total_students": student_count,
            "average_attendance": avg_pct,
            "low_attendance_students": low_count
        })

    return stats
