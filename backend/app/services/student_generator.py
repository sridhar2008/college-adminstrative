import random
from datetime import date
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
import app.models as models

FIRST_NAMES_MALE = [
    "Aarav", "Aditya", "Akhil", "Anand", "Arun", "Ashwin", "Balaji", "Chetan",
    "Deepak", "Dinesh", "Ganesh", "Gautam", "Hari", "Harish", "Karthik", "Keshav",
    "Madhav", "Manoj", "Mithun", "Mukesh", "Naveen", "Nikhil", "Pranav", "Prashanth",
    "Rahul", "Rajesh", "Rakesh", "Ramesh", "Rohit", "Sachin", "Sai", "Sanjay",
    "Saravanan", "Siddharth", "Siva", "Srinivas", "Subash", "Suresh", "Surya", "Varun",
    "Venkatesh", "Vignesh", "Vijay", "Vikram", "Vinay", "Vishnu", "Vivek", "Yash"
]

FIRST_NAMES_FEMALE = [
    "Aishwarya", "Ananya", "Anitha", "Bhavani", "Deepa", "Divya", "Gayathri", "Geetha",
    "Harini", "Ishwarya", "Janani", "Kavitha", "Kavya", "Keerthi", "Lavanya", "Madhumitha",
    "Malathi", "Meenakshi", "Nandhini", "Nisha", "Pavithra", "Pooja", "Preethi", "Priya",
    "Radha", "Rajalakshmi", "Ramya", "Revathi", "Sahana", "Sandhya", "Sangeetha", "Saranya",
    "Shalini", "Shreya", "Sneha", "Soundarya", "Sowmya", "Sridevi", "Subhashini", "Swathi",
    "Tanvi", "Tejaswini", "Uma", "Vaishnavi", "Varsha", "Vidya", "Vinodhini", "Yamini"
]

LAST_NAMES = [
    "Balakrishnan", "Chandran", "Iyer", "Iyengar", "Kumar", "Krishnan", "Menon", "Murugan",
    "Nair", "Natarajan", "Pillai", "Prabhu", "Radhakrishnan", "Rajan", "Ramachandran",
    "Raman", "Ranganathan", "Reddy", "Sankaran", "Santhanam", "Sharma", "Shetty", "Srinivasan",
    "Subramanian", "Sundaram", "Swaminathan", "Varadarajan", "Venkataraman", "Verma", "Viswanathan"
]

BLOOD_GROUPS = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"]
OCCUPATIONS = [
    "Software Engineer", "Civil Engineer", "Mechanical Engineer", "Government Officer",
    "School Principal", "Teacher", "Business Owner", "Bank Manager", "Chartered Accountant",
    "Doctor", "Professor", "Agriculturalist", "Railway Official", "Architect"
]
CITIES = ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Tirunelveli", "Vellore", "Erode"]

COLLEGE_DEPARTMENTS_DATA = [
    ("CSE", "Computer Science & Engineering", 1995),
    ("IT", "Information Technology", 2001),
    ("AIDS", "Artificial Intelligence & Data Science", 2020),
    ("AIML", "Artificial Intelligence & Machine Learning", 2021),
    ("CSBS", "Computer Science & Business Systems", 2020),
    ("CYS", "Cyber Security", 2021),
    ("ECE", "Electronics & Communication Engineering", 1996),
    ("EEE", "Electrical & Electronics Engineering", 1996),
    ("EIE", "Electronics & Instrumentation Engineering", 2004),
    ("MECH", "Mechanical Engineering", 1998),
    ("MECHTRON", "Mechatronics Engineering", 2012),
    ("AUTO", "Automobile Engineering", 2010),
    ("CIVIL", "Civil Engineering", 2005),
    ("AERO", "Aeronautical Engineering", 2008),
    ("AEROSPACE", "Aerospace Engineering", 2015),
    ("BME", "Biomedical Engineering", 2009),
    ("BIOTECH", "Biotechnology", 2006),
    ("CHEM", "Chemical Engineering", 2007),
    ("AGRI", "Agricultural Engineering", 2017),
    ("ROBOTICS", "Robotics & Automation", 2022)
]


def ensure_departments_and_programs(db: Session) -> Dict[str, models.Department]:
    """Ensures all ~20 engineering departments and their UG, PG, and PhD programs exist."""
    dept_map = {}
    for code, name, est_year in COLLEGE_DEPARTMENTS_DATA:
        dept = db.query(models.Department).filter(models.Department.code == code).first()
        if not dept:
            dept = models.Department(
                code=code,
                name=name,
                description=f"Department of {name}",
                established_year=est_year,
                is_active=True
            )
            db.add(dept)
            db.flush()
        dept_map[code] = dept

        # Ensure UG Program (4 years, 8 semesters)
        ug_code = f"BTECH-{code}"
        ug_prog = db.query(models.Program).filter(models.Program.code == ug_code).first()
        if not ug_prog:
            ug_prog = models.Program(
                department_id=dept.id,
                name=f"B.Tech {name}",
                code=ug_code,
                degree_level="UG",
                duration_years=4,
                total_semesters=8,
                is_active=True
            )
            db.add(ug_prog)

        # Ensure PG Program (2 years, 4 semesters)
        pg_code = f"MTECH-{code}"
        pg_prog = db.query(models.Program).filter(models.Program.code == pg_code).first()
        if not pg_prog:
            pg_prog = models.Program(
                department_id=dept.id,
                name=f"M.Tech {name}",
                code=pg_code,
                degree_level="PG",
                duration_years=2,
                total_semesters=4,
                is_active=True
            )
            db.add(pg_prog)

        # Ensure PhD Program (configurable research duration, default 3 years)
        phd_code = f"PHD-{code}"
        phd_prog = db.query(models.Program).filter(models.Program.code == phd_code).first()
        if not phd_prog:
            phd_prog = models.Program(
                department_id=dept.id,
                name=f"Ph.D. in {name}",
                code=phd_code,
                degree_level="PhD",
                duration_years=3,
                total_semesters=6,
                is_active=True
            )
            db.add(phd_prog)

    db.flush()
    return dept_map


def ensure_batches_and_sections(db: Session, program: models.Program, academic_year: models.AcademicYear) -> Dict[int, models.Batch]:
    """Ensures batches and sections exist for each year of a program."""
    batches_by_year = {}
    current_calendar_year = int(academic_year.code.split("-")[0])

    duration = program.duration_years
    for year in range(1, duration + 1):
        admission_year = current_calendar_year - (year - 1)
        grad_year = admission_year + duration
        batch_name = f"{program.code} ({admission_year}-{grad_year})"

        batch = db.query(models.Batch).filter(
            models.Batch.program_id == program.id,
            models.Batch.admission_year == admission_year
        ).first()

        if not batch:
            batch = models.Batch(
                program_id=program.id,
                batch_name=batch_name,
                admission_year=admission_year,
                graduation_year=grad_year,
                is_active=True
            )
            db.add(batch)
            db.flush()

        batches_by_year[year] = batch

        # Corresponding odd semester for current academic year (e.g. Year 1 -> Sem 1, Year 2 -> Sem 3, etc.)
        sem_num = (year - 1) * 2 + 1
        sem = db.query(models.Semester).filter(
            models.Semester.academic_year_id == academic_year.id,
            models.Semester.number == sem_num
        ).first()

        if sem:
            # Ensure Section A
            sec = db.query(models.Section).filter(
                models.Section.batch_id == batch.id,
                models.Section.semester_id == sem.id,
                models.Section.name == "A"
            ).first()
            if not sec:
                sec = models.Section(
                    batch_id=batch.id,
                    semester_id=sem.id,
                    name="A",
                    capacity=120
                )
                db.add(sec)
                db.flush()

    return batches_by_year


def generate_fictional_students(
    db: Session,
    department_id: Optional[str] = None,
    degree_level: str = "ALL",      # "ALL", "UG", "PG", "PhD"
    target_year: str = "ALL",       # "ALL", "1", "2", "3", "4"
    count_per_group: int = 50,
    phd_years: int = 3
) -> Dict[str, int]:
    """
    Transactional student generator that creates unique, realistic fictional students
    per department, per degree level, and per academic year.
    Avoids duplicate roll numbers and uses safe database transactions.
    """
    # 1. Fetch or initialize academic year
    curr_ay = db.query(models.AcademicYear).filter(models.AcademicYear.is_current == True).first()
    if not curr_ay:
        curr_ay = models.AcademicYear(
            code="2025-2026",
            start_date=date(2025, 7, 1),
            end_date=date(2026, 6, 30),
            is_current=True
        )
        db.add(curr_ay)
        db.flush()

    # Ensure all 8 semesters exist for this AY
    for s_no in range(1, 9):
        sem = db.query(models.Semester).filter(
            models.Semester.academic_year_id == curr_ay.id,
            models.Semester.number == s_no
        ).first()
        if not sem:
            sem = models.Semester(
                academic_year_id=curr_ay.id,
                number=s_no,
                semester_type="ODD" if s_no % 2 != 0 else "EVEN",
                start_date=date(2025, 7, 15) if s_no % 2 != 0 else date(2026, 1, 10),
                end_date=date(2025, 12, 10) if s_no % 2 != 0 else date(2026, 5, 20),
                is_active=(s_no % 2 != 0)
            )
            db.add(sem)
    db.flush()

    # 2. Ensure all 20 departments and programs
    dept_map = ensure_departments_and_programs(db)

    # 3. Resolve role for student
    student_role = db.query(models.Role).filter(models.Role.name == "student").first()
    if not student_role:
        student_role = models.Role(name="student", display_name="Student", is_system_role=True)
        db.add(student_role)
        db.flush()

    # Pre-compute password hash once for performance
    default_pw_hash = get_password_hash("Student@123")

    # Determine departments to process
    if department_id and department_id != "all":
        target_depts = db.query(models.Department).filter(models.Department.id == department_id).all()
    else:
        target_depts = db.query(models.Department).all()

    total_created = 0
    dept_count = len(target_depts)
    random.seed(42)  # Deterministic yet diverse generation

    current_calendar_year = int(curr_ay.code.split("-")[0])

    for dept in target_depts:
        # Fetch programs for this department
        programs = db.query(models.Program).filter(models.Program.department_id == dept.id).all()

        for prog in programs:
            if degree_level != "ALL" and prog.degree_level != degree_level:
                continue

            # Update PhD duration if configured differently
            if prog.degree_level == "PhD" and prog.duration_years != phd_years:
                prog.duration_years = phd_years
                prog.total_semesters = phd_years * 2
                db.flush()

            # Ensure batches and sections exist
            batches_by_year = ensure_batches_and_sections(db, prog, curr_ay)

            # Determine years to generate for
            years_to_process = []
            if target_year == "ALL":
                years_to_process = list(range(1, prog.duration_years + 1))
            else:
                try:
                    ty = int(target_year)
                    if 1 <= ty <= prog.duration_years:
                        years_to_process = [ty]
                except ValueError:
                    years_to_process = list(range(1, prog.duration_years + 1))

            for year in years_to_process:
                batch = batches_by_year.get(year)
                if not batch:
                    continue

                sem_num = (year - 1) * 2 + 1
                sem = db.query(models.Semester).filter(
                    models.Semester.academic_year_id == curr_ay.id,
                    models.Semester.number == sem_num
                ).first()

                sec = db.query(models.Section).filter(
                    models.Section.batch_id == batch.id,
                    models.Section.semester_id == sem.id
                ).first()

                # Check existing count for this batch to avoid duplicates
                existing_count = db.query(models.Student).filter(
                    models.Student.batch_id == batch.id,
                    models.Student.department_id == dept.id
                ).count()

                needed = max(0, count_per_group - existing_count)
                if needed == 0:
                    continue

                admission_year = batch.admission_year

                for seq in range(existing_count + 1, existing_count + needed + 1):
                    # Deterministic Unique Roll Number
                    if prog.degree_level == "UG":
                        roll = f"{admission_year}{dept.code}{seq:03d}"
                        reg_prefix = f"3124{admission_year % 100}1"
                    elif prog.degree_level == "PG":
                        roll = f"{admission_year}PG{dept.code}{seq:03d}"
                        reg_prefix = f"3124{admission_year % 100}2"
                    else:
                        roll = f"{admission_year}PHD{dept.code}{seq:03d}"
                        reg_prefix = f"3124{admission_year % 100}9"

                    reg_num = f"{reg_prefix}{abs(hash(dept.code)) % 1000:03d}{seq:04d}"

                    # Random realistic Indian name
                    is_female = (seq % 2 == 0)
                    first_name = random.choice(FIRST_NAMES_FEMALE if is_female else FIRST_NAMES_MALE)
                    last_name = random.choice(LAST_NAMES)
                    full_name = f"{first_name} {last_name}"

                    email = f"{first_name.lower()}.{roll.lower()}@engineering.edu"

                    # Check if User already exists
                    existing_user = db.query(models.User).filter(
                        (models.User.username == roll) | (models.User.email == email)
                    ).first()
                    if existing_user:
                        continue

                    # 1. Create User
                    user = models.User(
                        email=email,
                        username=roll,
                        hashed_password=default_pw_hash,
                        role_id=student_role.id,
                        full_name=full_name,
                        phone=f"+91 98{random.randint(10000000, 99999999)}"
                    )
                    db.add(user)
                    db.flush()

                    # 2. Create Student
                    birth_year = admission_year - (18 if prog.degree_level == "UG" else (22 if prog.degree_level == "PG" else 24))
                    dob = date(birth_year, random.randint(1, 12), random.randint(1, 28))
                    city = random.choice(CITIES)

                    student = models.Student(
                        user_id=user.id,
                        roll_number=roll,
                        registration_number=reg_num,
                        department_id=dept.id,
                        program_id=prog.id,
                        batch_id=batch.id,
                        current_semester_id=sem.id,
                        section_id=sec.id,
                        dob=dob,
                        gender="Female" if is_female else "Male",
                        blood_group=random.choice(BLOOD_GROUPS),
                        college_email=email,
                        phone=user.phone,
                        residential_address=f"No. {random.randint(1, 150)}, {city} Road, {city}, TN",
                        admission_status="CONFIRMED",
                        academic_status="ACTIVE",
                        admission_date=date(admission_year, 8, 1)
                    )
                    db.add(student)
                    db.flush()

                    # 3. Create Parent / Guardian contact
                    parent_name = f"{random.choice(FIRST_NAMES_MALE)} {last_name}"
                    pg = models.ParentGuardian(
                        student_id=student.id,
                        relation_type="FATHER",
                        full_name=parent_name,
                        occupation=random.choice(OCCUPATIONS),
                        phone=f"+91 94{random.randint(10000000, 99999999)}",
                        email=f"parent.{roll.lower()}@gmail.com",
                        address=student.residential_address,
                        is_primary_contact=True
                    )
                    db.add(pg)

                    # 4. Create Student Contact Diary (Parent & Emergency)
                    sc_parent = models.StudentContact(
                        student_id=student.id,
                        category="PARENT",
                        name=parent_name,
                        relationship="Father",
                        phone=pg.phone,
                        email=pg.email,
                        is_public_in_directory=False,
                        notes="Primary Emergency Contact"
                    )
                    db.add(sc_parent)

                    # Peer / Friend Contact (some with directory consent)
                    peer_first = random.choice(FIRST_NAMES_MALE if is_female else FIRST_NAMES_FEMALE)
                    peer_name = f"{peer_first} {random.choice(LAST_NAMES)}"
                    has_consent = (seq % 3 == 0)

                    sc_friend = models.StudentContact(
                        student_id=student.id,
                        category="FRIEND",
                        name=peer_name,
                        relationship="Classmate / Peer",
                        phone=f"+91 97{random.randint(10000000, 99999999)}",
                        email=f"{peer_first.lower()}@engineering.edu",
                        is_public_in_directory=has_consent,
                        notes="Peer Study Group"
                    )
                    db.add(sc_friend)

                    total_created += 1

                    # Commit every 100 students for efficient memory handling
                    if total_created % 100 == 0:
                        db.commit()

    db.commit()
    return {
        "students_created": total_created,
        "departments_covered": dept_count
    }


def clear_generated_sample_students(db: Session) -> int:
    """
    Safely removes generated sample students while protecting primary demo accounts
    (2024CS101, 2023CS205, Dean, HOD, Faculty, etc.).
    """
    protected_rolls = ["2024CS101", "2023CS205"]
    
    students_to_delete = db.query(models.Student).filter(
        ~models.Student.roll_number.in_(protected_rolls)
    ).all()

    count = len(students_to_delete)
    for s in students_to_delete:
        u_id = s.user_id
        # Delete student contacts, guardians, marks, records
        db.query(models.StudentContact).filter(models.StudentContact.student_id == s.id).delete()
        db.query(models.ParentGuardian).filter(models.ParentGuardian.student_id == s.id).delete()
        db.query(models.AttendanceRecord).filter(models.AttendanceRecord.student_id == s.id).delete()
        db.query(models.Mark).filter(models.Mark.student_id == s.id).delete()
        db.query(models.StudentEnrollment).filter(models.StudentEnrollment.student_id == s.id).delete()
        db.delete(s)
        if u_id:
            u = db.query(models.User).filter(models.User.id == u_id).first()
            if u:
                db.delete(u)

    db.commit()
    return count
