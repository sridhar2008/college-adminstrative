from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserInfo
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user via Roll Number, Employee ID, Username, or Institutional Email.
    Returns signed JWT token with claims and user metadata.
    """
    ident = login_data.username_or_email.strip()
    user = db.query(User).filter(
        (User.email.ilike(ident)) | (User.username.ilike(ident))
    ).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/roll number or password. Please try again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This institutional account has been deactivated. Contact the CSMS administrator.",
        )

    role_name = user.role.name if user.role else "student"
    role_display = user.role.display_name if user.role else "Student"

    # Contextual metadata
    dept_id = None
    dept_name = None
    roll_number = None
    employee_id = None

    if user.student_profile:
        roll_number = user.student_profile.roll_number
        if user.student_profile.department_id:
            dept_id = user.student_profile.department_id
    elif user.faculty_profile:
        employee_id = user.faculty_profile.employee_id
        dept_id = user.faculty_profile.department_id
        if user.faculty_profile.department:
            dept_name = user.faculty_profile.department.name

    metadata = {
        "full_name": user.full_name,
        "email": user.email,
        "username": user.username,
        "role_display": role_display,
        "department_id": dept_id,
        "department_name": dept_name,
        "roll_number": roll_number,
        "employee_id": employee_id
    }

    access_token = create_access_token(
        subject=user.id,
        role=role_name,
        user_metadata=metadata
    )

    user_info = {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "role": role_name,
        "role_display": role_display,
        "department_id": dept_id,
        "department_name": dept_name,
        "roll_number": roll_number,
        "employee_id": employee_id,
        "is_active": user.is_active
    }

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=7200,
        user=user_info
    )


@router.get("/me", response_model=UserInfo)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve full profile information for the authenticated session."""
    role_name = current_user.role.name if current_user.role else "student"
    role_display = current_user.role.display_name if current_user.role else "Student"

    dept_id = None
    dept_name = None
    roll_no = None
    emp_id = None

    if current_user.student_profile:
        roll_no = current_user.student_profile.roll_number
        dept_id = current_user.student_profile.department_id
        if current_user.student_profile.batch and current_user.student_profile.batch.program:
            dept_name = current_user.student_profile.batch.program.department.name
    elif current_user.faculty_profile:
        emp_id = current_user.faculty_profile.employee_id
        dept_id = current_user.faculty_profile.department_id
        if current_user.faculty_profile.department:
            dept_name = current_user.faculty_profile.department.name

    return UserInfo(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        role=role_name,
        role_display=role_display,
        department_id=dept_id,
        department_name=dept_name,
        roll_number=roll_no,
        employee_id=emp_id,
        is_active=current_user.is_active
    )


@router.get("/demo-accounts")
def get_demo_accounts():
    """Returns sample fictional credentials for easy one-click testing of all 8 roles."""
    return [
        {
            "role": "Dean",
            "code": "dean",
            "username": "dean@engineering.edu",
            "password": "Dean@123",
            "description": "Institution-level overview across all departments, academic progress & audit logs"
        },
        {
            "role": "Department HOD",
            "code": "hod",
            "username": "hod.cse@engineering.edu",
            "password": "Hod@123",
            "description": "Head of Computer Science & Engineering. Faculty allocation, approvals, dept stats"
        },
        {
            "role": "Professor / Faculty",
            "code": "faculty",
            "username": "prof.sharma@engineering.edu",
            "password": "Faculty@123",
            "description": "Professor teaching Operating Systems. Enters attendance & internal marks"
        },
        {
            "role": "Subject Faculty",
            "code": "subject_faculty",
            "username": "faculty.anita@engineering.edu",
            "password": "Faculty@123",
            "description": "Faculty teaching Data Structures & Algorithms. Section-wise evaluation"
        },
        {
            "role": "Guest Lecturer",
            "code": "guest",
            "username": "guest.lecturer@engineering.edu",
            "password": "Guest@123",
            "description": "Restricted view limited to assigned session details and materials"
        },
        {
            "role": "Student (UG Year 2)",
            "code": "student",
            "username": "2024CS101",
            "password": "Student@123",
            "description": "Student Arun Kumar (B.Tech CSE). View attendance %, marks, timetable, diary"
        },
        {
            "role": "Admin Staff",
            "code": "admin",
            "username": "admin@engineering.edu",
            "password": "Admin@123",
            "description": "Institutional registry, student registration, program & semester configurations"
        },
        {
            "role": "Parent / Guardian",
            "code": "parent",
            "username": "parent.ramesh@gmail.com",
            "password": "Parent@123",
            "description": "Parent of Arun Kumar. Read-only view of ward's attendance and published results"
        }
    ]
