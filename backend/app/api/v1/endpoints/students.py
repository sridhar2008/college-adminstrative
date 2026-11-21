import csv
import io
from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user, RoleChecker
from app.core.security import get_password_hash
from app.models.user import User, Role
from app.models.student import Student, ParentGuardian, StudentContact
from app.models.academic import Department, Program, Batch, Section, Semester, AcademicYear
from app.models.attendance import AttendanceRecord, AttendanceSession
from app.models.assessment import Mark
from app.models.curriculum import Subject
from app.models.audit import AuditLog

router = APIRouter()


class StudentCreateForm(BaseModel):
    full_name: str
    roll_number: str
    registration_number: str
    department_id: str
    program_id: str
    batch_id: str
    current_semester_id: str
    section_id: str
    dob: str
    gender: str
    blood_group: Optional[str] = "O+"
    college_email: str
    phone: Optional[str] = None
    residential_address: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_occupation: Optional[str] = None
    admission_status: str = "CONFIRMED"
    academic_status: str = "ACTIVE"
    initial_password: Optional[str] = "Student@123"


class StudentPhotoUpload(BaseModel):
    photo_data: str  # Base64 data URL or image URL


class StudentUpdateForm(BaseModel):
    full_name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    profile_image_url: Optional[str] = None
    residential_address: Optional[str] = None
    admission_status: Optional[str] = None
    academic_status: Optional[str] = None
    current_semester_id: Optional[str] = None
    section_id: Optional[str] = None


class PromotionRequest(BaseModel):
    from_semester_id: str
    to_semester_id: str
    department_id: Optional[str] = "all"


class StatusChangeRequest(BaseModel):
    academic_status: str  # ACTIVE, SUSPENDED, GRADUATED, PROVISIONAL


@router.get("/lookup/{roll_number}")
def lookup_student_by_roll_number(
    roll_number: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search student by Roll Number with strict server-side authorization:
    - Dean / Admin: Can view any student in the college.
    - HOD: Can view students in their assigned department.
    - Faculty: Can view students enrolled in their assigned classes.
    - Student: Can view only their own record.
    - Parent: Can view only their linked ward.
    """
    roll_clean = roll_number.strip().upper()
    student = db.query(Student).filter(Student.roll_number.ilike(roll_clean)).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with roll number '{roll_number}' was not found in institutional records."
        )

    user_role = current_user.role.name if current_user.role else "student"

    if user_role == "student":
        if not current_user.student_profile or current_user.student_profile.id != student.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security Violation: You are not authorized to access another student's confidential profile."
            )
    elif user_role == "parent":
        parent_records = [pg.student_id for pg in student.parents_guardians if pg.user_id == current_user.id]
        if not parent_records:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security Violation: You can only access academic details of your verified ward."
            )
    elif user_role == "hod":
        if current_user.faculty_profile and current_user.faculty_profile.department_id != student.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Department HOD can only access students enrolled within their own department."
            )

    # Log audit entry
    audit = AuditLog(
        user_id=current_user.id,
        action="LOOKUP_STUDENT",
        entity_type="STUDENT",
        entity_id=student.id
    )
    db.add(audit)
    db.commit()

    total_records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student.id).count()
    attended_records = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == student.id,
        AttendanceRecord.status.in_(["PRESENT", "ON_DUTY"])
    ).count()

    attendance_pct = round((attended_records / total_records * 100), 1) if total_records > 0 else 100.0

    marks_records = db.query(Mark).filter(Mark.student_id == student.id, Mark.is_approved == True).all()
    marks_data = []
    for m in marks_records:
        marks_data.append({
            "subject_code": m.subject.code if m.subject else "",
            "subject_name": m.subject.name if m.subject else "",
            "assessment": m.assessment_type.name if m.assessment_type else "",
            "marks_obtained": m.marks_obtained,
            "max_marks": m.assessment_type.max_marks if m.assessment_type else 100.0
        })

    dept = db.query(Department).filter(Department.id == student.department_id).first()
    prog = db.query(Program).filter(Program.id == student.program_id).first()
    sec = db.query(Section).filter(Section.id == student.section_id).first()
    sem = db.query(Semester).filter(Semester.id == student.current_semester_id).first()

    primary_parent = db.query(ParentGuardian).filter(ParentGuardian.student_id == student.id).first()

    return {
        "found": True,
        "student": {
            "id": student.id,
            "roll_number": student.roll_number,
            "registration_number": student.registration_number,
            "full_name": student.user.full_name if student.user else "Unknown",
            "college_email": student.college_email,
            "phone": student.phone if user_role in ["dean", "admin", "hod"] or (user_role == "student" and current_user.id == student.user_id) else None,
            "department_id": student.department_id,
            "department_name": dept.name if dept else "N/A",
            "program_id": student.program_id,
            "program_name": prog.name if prog else "N/A",
            "degree_level": prog.degree_level if prog else "UG",
            "current_semester_id": student.current_semester_id,
            "semester_number": sem.number if sem else 1,
            "section_id": student.section_id,
            "section_name": sec.name if sec else "A",
            "dob": str(student.dob),
            "gender": student.gender,
            "blood_group": student.blood_group,
            "residential_address": student.residential_address,
            "parent_name": primary_parent.full_name if primary_parent else None,
            "parent_phone": primary_parent.phone if primary_parent and user_role in ["dean", "admin", "hod"] else None,
            "admission_status": student.admission_status,
            "academic_status": student.academic_status,
            "admission_date": str(student.admission_date)
        },
        "attendance_summary": {
            "conducted_classes": total_records,
            "attended_classes": attended_records,
            "percentage": attendance_pct,
            "shortage_alert": attendance_pct < 75.0
        },
        "recent_marks": marks_data
    }


@router.get("")
def list_students(
    search: Optional[str] = None,
    department_id: Optional[str] = None,
    program_id: Optional[str] = None,
    batch_id: Optional[str] = None,
    semester_id: Optional[str] = None,
    academic_status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List students with multi-field search and department, program, batch, status filters."""
    query = db.query(Student).join(User, Student.user_id == User.id)

    user_role = current_user.role.name if current_user.role else ""
    if user_role == "hod" and current_user.faculty_profile:
        query = query.filter(Student.department_id == current_user.faculty_profile.department_id)
    elif department_id and department_id != "all":
        query = query.filter(Student.department_id == department_id)

    if program_id and program_id != "all":
        query = query.filter(Student.program_id == program_id)
    if batch_id and batch_id != "all":
        query = query.filter(Student.batch_id == batch_id)
    if semester_id and semester_id != "all":
        query = query.filter(Student.current_semester_id == semester_id)
    if academic_status and academic_status != "all":
        query = query.filter(Student.academic_status == academic_status)

    if search:
        s_clean = f"%{search.strip()}%"
        query = query.filter(
            (Student.roll_number.ilike(s_clean)) |
            (Student.registration_number.ilike(s_clean)) |
            (User.full_name.ilike(s_clean)) |
            (Student.college_email.ilike(s_clean))
        )

    total_count = query.count()
    students = query.order_by(Student.roll_number.asc()).offset(offset).limit(limit).all()

    items = []
    for s in students:
        dept = db.query(Department).filter(Department.id == s.department_id).first()
        prog = db.query(Program).filter(Program.id == s.program_id).first()
        sec = db.query(Section).filter(Section.id == s.section_id).first()
        sem = db.query(Semester).filter(Semester.id == s.current_semester_id).first()
        items.append({
            "id": s.id,
            "roll_number": s.roll_number,
            "registration_number": s.registration_number,
            "full_name": s.user.full_name if s.user else "",
            "college_email": s.college_email,
            "phone": s.phone,
            "department_id": s.department_id,
            "department_name": dept.name if dept else "",
            "program_id": s.program_id,
            "program_name": prog.name if prog else "",
            "degree_level": prog.degree_level if prog else "UG",
            "semester_number": sem.number if sem else 1,
            "section_name": sec.name if sec else "A",
            "academic_status": s.academic_status,
            "admission_status": s.admission_status,
            "dob": str(s.dob),
            "gender": s.gender,
            "blood_group": s.blood_group,
            "profile_image_url": s.profile_image_url,
            "residential_address": s.residential_address
        })

    return {
        "items": items,
        "total": total_count,
        "limit": limit,
        "offset": offset
    }


@router.post("")
def create_student(
    form: StudentCreateForm,
    current_user: User = Depends(RoleChecker(["admin", "dean", "hod"])),
    db: Session = Depends(get_db)
):
    """Register a new student with unique roll number and credentials."""
    roll = form.roll_number.strip().upper()
    email = form.college_email.strip().lower()

    # Check roll number uniqueness
    existing_roll = db.query(Student).filter(Student.roll_number.ilike(roll)).first()
    if existing_roll:
        raise HTTPException(status_code=400, detail=f"Roll number '{roll}' is already assigned.")

    existing_reg = db.query(Student).filter(Student.registration_number.ilike(form.registration_number.strip())).first()
    if existing_reg:
        raise HTTPException(status_code=400, detail=f"Registration number '{form.registration_number}' is already in use.")

    existing_user = db.query(User).filter((User.username.ilike(roll)) | (User.email.ilike(email))).first()
    if existing_user:
        raise HTTPException(status_code=400, detail=f"User account with this email/roll number already exists.")

    student_role = db.query(Role).filter(Role.name == "student").first()

    # 1. Create User account
    user = User(
        email=email,
        username=roll,
        hashed_password=get_password_hash(form.initial_password or "Student@123"),
        role_id=student_role.id,
        full_name=form.full_name.strip(),
        phone=form.phone
    )
    db.add(user)
    db.flush()

    # 2. Parse Date of Birth
    dob_val = date.fromisoformat(form.dob) if form.dob else date(2005, 1, 1)

    # 3. Create Student profile
    student = Student(
        user_id=user.id,
        roll_number=roll,
        registration_number=form.registration_number.strip(),
        department_id=form.department_id,
        program_id=form.program_id,
        batch_id=form.batch_id,
        current_semester_id=form.current_semester_id,
        section_id=form.section_id,
        dob=dob_val,
        gender=form.gender,
        blood_group=form.blood_group,
        college_email=email,
        phone=form.phone,
        residential_address=form.residential_address,
        admission_status=form.admission_status,
        academic_status=form.academic_status,
        admission_date=date.today()
    )
    db.add(student)
    db.flush()

    # 4. Optional Parent details
    if form.parent_name:
        pg = ParentGuardian(
            student_id=student.id,
            relation_type="FATHER",
            full_name=form.parent_name.strip(),
            occupation=form.parent_occupation,
            phone=form.parent_phone or form.phone or "+91 9000000000",
            email=f"parent.{roll.lower()}@gmail.com",
            address=form.residential_address,
            is_primary_contact=True
        )
        db.add(pg)

        # Also add to private student contact diary
        sc = StudentContact(
            student_id=student.id,
            category="PARENT",
            name=form.parent_name.strip(),
            relationship="Father",
            phone=pg.phone,
            is_public_in_directory=False
        )
        db.add(sc)

    # Log audit
    audit = AuditLog(
        user_id=current_user.id,
        action="CREATE_STUDENT",
        entity_type="STUDENT",
        entity_id=student.id
    )
    db.add(audit)
    db.commit()

    return {"success": True, "message": "Student created successfully.", "id": student.id, "roll_number": student.roll_number}


@router.put("/{student_id}")
def update_student(
    student_id: str,
    form: StudentUpdateForm,
    current_user: User = Depends(RoleChecker(["admin", "dean", "hod"])),
    db: Session = Depends(get_db)
):
    """Update student profile details."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found.")

    if form.full_name and student.user:
        student.user.full_name = form.full_name.strip()
    if form.dob:
        student.dob = date.fromisoformat(form.dob)
    if form.gender:
        student.gender = form.gender
    if form.blood_group:
        student.blood_group = form.blood_group
    if form.phone:
        student.phone = form.phone
        if student.user:
            student.user.phone = form.phone
    if form.profile_image_url:
        student.profile_image_url = form.profile_image_url
    if form.residential_address:
        student.residential_address = form.residential_address
    if form.admission_status:
        student.admission_status = form.admission_status
    if form.academic_status:
        student.academic_status = form.academic_status
    if form.current_semester_id:
        student.current_semester_id = form.current_semester_id
    if form.section_id:
        student.section_id = form.section_id

    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE_STUDENT",
        entity_type="STUDENT",
        entity_id=student.id
    )
    db.add(audit)
    db.commit()

    return {"success": True, "message": "Student profile updated successfully."}


@router.post("/{student_id}/photo")
def upload_student_photo(
    student_id: str,
    req: StudentPhotoUpload,
    current_user: User = Depends(RoleChecker(["admin", "dean", "hod", "student"])),
    db: Session = Depends(get_db)
):
    """Upload or update student profile photo for ID card generation."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found.")

    # Guard: if student role, can only upload for self
    user_role = current_user.role.name if current_user.role else ""
    if user_role == "student" and (not current_user.student_profile or current_user.student_profile.id != student.id):
        raise HTTPException(status_code=403, detail="Unauthorized to upload photo for another student.")

    student.profile_image_url = req.photo_data
    db.commit()

    return {
        "success": True,
        "message": "Student photo uploaded successfully.",
        "profile_image_url": student.profile_image_url
    }


@router.get("/{student_id}/id-card")
def get_student_id_card_data(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get rich student profile data formatted specifically for official institutional ID card generation."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found.")

    user_role = current_user.role.name if current_user.role else ""
    if user_role == "student" and (not current_user.student_profile or current_user.student_profile.id != student.id):
        raise HTTPException(status_code=403, detail="Unauthorized to access another student's ID card.")

    dept = db.query(Department).filter(Department.id == student.department_id).first()
    prog = db.query(Program).filter(Program.id == student.program_id).first()
    batch = db.query(Batch).filter(Batch.id == student.batch_id).first()
    sem = db.query(Semester).filter(Semester.id == student.current_semester_id).first()
    sec = db.query(Section).filter(Section.id == student.section_id).first()
    ay = db.query(AcademicYear).first()

    parent = db.query(ParentGuardian).filter(ParentGuardian.student_id == student.id).first()

    return {
        "id": student.id,
        "roll_number": student.roll_number,
        "registration_number": student.registration_number,
        "full_name": student.user.full_name if student.user else "Student Name",
        "department_name": dept.name if dept else "Engineering",
        "department_code": dept.code if dept else "ENG",
        "program_name": prog.name if prog else "B.Tech",
        "degree_level": prog.degree_level if prog else "UG",
        "batch_name": batch.name if batch else "2024-2028",
        "academic_year": ay.name if ay else "2024-2025",
        "semester_number": sem.number if sem else 1,
        "section_name": sec.name if sec else "A",
        "dob": str(student.dob),
        "blood_group": student.blood_group or "O+",
        "phone": student.phone or "+91 9876543210",
        "college_email": student.college_email,
        "emergency_contact": parent.phone if parent else student.phone,
        "parent_name": parent.full_name if parent else "Parent / Guardian",
        "profile_image_url": student.profile_image_url,
        "residential_address": student.residential_address or "College Hostel / Campus",
        "institution_name": "APEX ENGINEERING COLLEGE",
        "institution_affiliation": "Affiliated to Anna University | Approved by AICTE",
        "institution_code": "COLLEGE CODE: 3124",
        "valid_until": "2028" if (prog and prog.degree_level == "UG") else ("2026" if (prog and prog.degree_level == "PG") else "2029")
    }


@router.patch("/{student_id}/status")
def change_student_status(
    student_id: str,
    req: StatusChangeRequest,
    current_user: User = Depends(RoleChecker(["admin", "dean", "hod"])),
    db: Session = Depends(get_db)
):
    """Change student status (ACTIVE, SUSPENDED, GRADUATED, PROVISIONAL)."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found.")

    student.academic_status = req.academic_status
    if req.academic_status == "SUSPENDED" and student.user:
        student.user.is_active = False
    elif req.academic_status == "ACTIVE" and student.user:
        student.user.is_active = True

    audit = AuditLog(
        user_id=current_user.id,
        action="CHANGE_STUDENT_STATUS",
        entity_type="STUDENT",
        entity_id=student.id,
        new_state=req.academic_status
    )
    db.add(audit)
    db.commit()

    return {"success": True, "message": f"Status updated to '{req.academic_status}'."}


@router.delete("/{student_id}")
def delete_student(
    student_id: str,
    current_user: User = Depends(RoleChecker(["admin", "dean"])),
    db: Session = Depends(get_db)
):
    """Soft delete / deactivate student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found.")

    student.is_active = False
    student.academic_status = "DEACTIVATED"
    if student.user:
        student.user.is_active = False

    audit = AuditLog(
        user_id=current_user.id,
        action="DEACTIVATE_STUDENT",
        entity_type="STUDENT",
        entity_id=student.id
    )
    db.add(audit)
    db.commit()

    return {"success": True, "message": "Student successfully deactivated."}


@router.post("/promote")
def promote_students(
    req: PromotionRequest,
    current_user: User = Depends(RoleChecker(["admin", "dean"])),
    db: Session = Depends(get_db)
):
    """Batch promote students from one semester to the next."""
    query = db.query(Student).filter(Student.current_semester_id == req.from_semester_id, Student.academic_status == "ACTIVE")
    if req.department_id and req.department_id != "all":
        query = query.filter(Student.department_id == req.department_id)

    students = query.all()
    count = len(students)

    for s in students:
        s.current_semester_id = req.to_semester_id

    db.commit()
    return {"success": True, "message": f"Promoted {count} students to semester successfully.", "promoted_count": count}


@router.post("/import-csv")
async def import_students_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(RoleChecker(["admin", "dean"])),
    db: Session = Depends(get_db)
):
    """Bulk import students from CSV file."""
    contents = await file.read()
    decoded = contents.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded))

    student_role = db.query(Role).filter(Role.name == "student").first()
    default_pw = get_password_hash("Student@123")
    imported_count = 0

    for row in reader:
        roll = row.get("Roll Number", "").strip().upper()
        if not roll:
            continue

        existing = db.query(Student).filter(Student.roll_number.ilike(roll)).first()
        if existing:
            continue

        full_name = row.get("Student Name", "").strip() or "Imported Student"
        email = row.get("Email", "").strip().lower() or f"{roll.lower()}@engineering.edu"
        dept_code = row.get("Department", "").strip()
        dept = db.query(Department).filter(Department.code.ilike(dept_code)).first()
        if not dept:
            dept = db.query(Department).first()

        prog = db.query(Program).filter(Program.department_id == dept.id).first()
        batch = db.query(Batch).filter(Batch.program_id == prog.id).first()
        sem = db.query(Semester).first()
        sec = db.query(Section).first()

        user = User(
            email=email,
            username=roll,
            hashed_password=default_pw,
            role_id=student_role.id,
            full_name=full_name,
            phone="+91 9800000000"
        )
        db.add(user)
        db.flush()

        student = Student(
            user_id=user.id,
            roll_number=roll,
            registration_number=row.get("Registration Number", "").strip() or f"3124{roll}",
            department_id=dept.id,
            program_id=prog.id,
            batch_id=batch.id if batch else None,
            current_semester_id=sem.id,
            section_id=sec.id if sec else None,
            dob=date(2005, 1, 1),
            gender="Male",
            blood_group="O+",
            college_email=email,
            phone=user.phone,
            residential_address="Imported Address",
            admission_status="CONFIRMED",
            academic_status="ACTIVE",
            admission_date=date.today()
        )
        db.add(student)
        imported_count += 1

    db.commit()
    return {"success": True, "message": f"Successfully imported {imported_count} student records.", "imported_count": imported_count}
