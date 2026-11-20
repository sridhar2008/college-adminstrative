from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.faculty import SubjectAllocation
from app.models.student import Student
from app.models.curriculum import Subject
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.attendance import AttendanceSessionCreate, StudentSubjectAttendanceSummary

router = APIRouter()


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
    if not current_user.student_profile:
        return []

    student_id = current_user.student_profile.id
    
    # Query all attendance records for this student
    records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student_id).all()
    
    # Aggregate by subject
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


@router.post("/sessions")
def create_attendance_session(
    data: AttendanceSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record attendance for a class session.
    Prevents duplicate entries for the same subject, allocation, date, and period.
    """
    if not current_user.faculty_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty members can record attendance."
        )

    # Check for duplicate session
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

    session = AttendanceSession(
        subject_allocation_id=data.subject_allocation_id,
        session_date=data.session_date,
        period_number=data.period_number,
        topic_covered=data.topic_covered,
        conducted_by_faculty_id=current_user.faculty_profile.id
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
    return {"success": True, "message": "Attendance successfully recorded and locked.", "session_id": session.id}
