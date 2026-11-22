import sys
import os
from datetime import date, datetime, timedelta, timezone

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
import app.models as models


def seed_database():
    print("[*] Initializing Database Schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        existing_role = db.query(models.Role).first()
        existing_admin = db.query(models.User).filter(models.User.email == "admin@engineering.edu").first()
        if existing_role and existing_admin:
            print("[✓] Database already populated with seed records and admin user.")
            return

        print("[*] Creating System Roles...")
        roles_data = [
            ("dean", "Dean / Director", "Institution-level executive oversight and analytics"),
            ("hod", "Department HOD", "Head of Department with faculty allocation and academic approval"),
            ("faculty", "Professor / Faculty", "Teaching faculty with marks and attendance entry access"),
            ("subject_faculty", "Subject Faculty", "Faculty assigned to specific course sections"),
            ("guest", "Guest Lecturer", "Restricted access to assigned class sessions"),
            ("student", "Student", "Access to personal academic profile, timetable, marks & diary"),
            ("admin", "Administrative Staff", "Student enrollment, registry & system management"),
            ("parent", "Parent / Guardian", "Read-only access to linked ward's attendance and published results"),
        ]
        roles_map = {}
        for code, disp, desc in roles_data:
            role = models.Role(name=code, display_name=disp, description=desc, is_system_role=True)
            db.add(role)
            db.flush()
            roles_map[code] = role

        print("[*] Creating Departments...")
        departments_data = [
            ("CSE", "Computer Science & Engineering", 1995),
            ("ECE", "Electronics & Communication Engineering", 1996),
            ("IT", "Information Technology", 2001),
            ("MECH", "Mechanical Engineering", 1998)
        ]
        dept_map = {}
        for code, name, est in departments_data:
            dept = models.Department(code=code, name=name, established_year=est, is_active=True)
            db.add(dept)
            db.flush()
            dept_map[code] = dept

        print("[*] Creating Programs (UG 4-Year, PG 2-Year, PhD)...")
        prog_cse_ug = models.Program(
            department_id=dept_map["CSE"].id,
            name="B.Tech Computer Science & Engineering",
            code="BTECH-CSE",
            degree_level="UG",
            duration_years=4,
            total_semesters=8,
            is_active=True
        )
        prog_it_ug = models.Program(
            department_id=dept_map["IT"].id,
            name="B.Tech Information Technology",
            code="BTECH-IT",
            degree_level="UG",
            duration_years=4,
            total_semesters=8,
            is_active=True
        )
        prog_cse_pg = models.Program(
            department_id=dept_map["CSE"].id,
            name="M.Tech Computer Science & Engineering",
            code="MTECH-CSE",
            degree_level="PG",
            duration_years=2,
            total_semesters=4,
            is_active=True
        )
        prog_phd = models.Program(
            department_id=dept_map["CSE"].id,
            name="Ph.D. in Computer Science",
            code="PHD-CSE",
            degree_level="PhD",
            duration_years=3,
            total_semesters=6,
            is_active=True
        )
        db.add_all([prog_cse_ug, prog_it_ug, prog_cse_pg, prog_phd])
        db.flush()

        print("[*] Creating Academic Years and Semesters...")
        curr_year = models.AcademicYear(
            code="2025-2026",
            start_date=date(2025, 7, 1),
            end_date=date(2026, 6, 30),
            is_current=True
        )
        db.add(curr_year)
        db.flush()

        semesters = []
        for sem_no in range(1, 9):
            sem = models.Semester(
                academic_year_id=curr_year.id,
                number=sem_no,
                semester_type="ODD" if sem_no % 2 != 0 else "EVEN",
                start_date=date(2025, 7, 15) if sem_no % 2 != 0 else date(2026, 1, 10),
                end_date=date(2025, 12, 10) if sem_no % 2 != 0 else date(2026, 5, 20),
                is_active=(sem_no == 3 or sem_no == 5 or sem_no == 7 or sem_no == 1)
            )
            db.add(sem)
            db.flush()
            semesters.append(sem)

        sem3 = semesters[2]  # Semester 3

        print("[*] Creating Batches and Sections...")
        batch_2024_28 = models.Batch(
            program_id=prog_cse_ug.id,
            batch_name="2024-2028 (UG Batch)",
            admission_year=2024,
            graduation_year=2028,
            is_active=True
        )
        db.add(batch_2024_28)
        db.flush()

        sec_a = models.Section(
            batch_id=batch_2024_28.id,
            semester_id=sem3.id,
            name="A",
            capacity=60
        )
        sec_b = models.Section(
            batch_id=batch_2024_28.id,
            semester_id=sem3.id,
            name="B",
            capacity=60
        )
        db.add_all([sec_a, sec_b])
        db.flush()

        print("[*] Creating Configurable Assessment Types...")
        assess_types = [
            ("IA1", "Internal Assessment 1", 100.0, 20.0, 50.0),
            ("IA2", "Internal Assessment 2", 100.0, 20.0, 50.0),
            ("IA3", "Internal Assessment 3", 100.0, 20.0, 50.0),
            ("ASSIGNMENT", "Continuous Assignments", 50.0, 10.0, 25.0),
            ("LAB", "Practical / Lab Assessment", 100.0, 25.0, 50.0),
            ("SEMESTER_EXAM", "End-Semester Examination", 100.0, 50.0, 50.0)
        ]
        assess_map = {}
        for code, name, max_m, wt, pass_m in assess_types:
            at = models.AssessmentType(
                code=code, name=name, max_marks=max_m, weightage_percent=wt, passing_marks=pass_m, is_active=True
            )
            db.add(at)
            db.flush()
            assess_map[code] = at

        print("[*] Creating Subjects for Semester 3 CSE...")
        subjects_data = [
            ("CS301", "Data Structures and Algorithms", "THEORY", 4, 3),
            ("CS302", "Database Management Systems", "THEORY", 4, 3),
            ("CS303", "Operating Systems", "THEORY", 3, 3),
            ("CS304", "Computer Networks", "THEORY", 3, 3),
            ("CS305", "Software Engineering", "THEORY", 3, 3),
        ]
        sub_map = {}
        for code, name, stype, credits, sem_num in subjects_data:
            subj = models.Subject(
                department_id=dept_map["CSE"].id,
                code=code,
                name=name,
                subject_type=stype,
                credits=credits,
                semester_number=sem_num,
                is_active=True
            )
            db.add(subj)
            db.flush()
            sub_map[code] = subj

        print("[*] Creating Institutional Users & Profiles...")
        # 1. Dean
        user_dean = models.User(
            email="dean@engineering.edu",
            username="DEAN01",
            hashed_password=get_password_hash("Dean@123"),
            role_id=roles_map["dean"].id,
            full_name="Dr. K. Ramanathan",
            phone="+91 94441 12345"
        )
        # 2. HOD CSE
        user_hod = models.User(
            email="hod.cse@engineering.edu",
            username="HODCSE",
            hashed_password=get_password_hash("Hod@123"),
            role_id=roles_map["hod"].id,
            full_name="Dr. Sundar Rajan",
            phone="+91 94442 23456"
        )
        # 3. Faculty (Professor)
        user_prof = models.User(
            email="prof.sharma@engineering.edu",
            username="FAC01",
            hashed_password=get_password_hash("Faculty@123"),
            role_id=roles_map["faculty"].id,
            full_name="Dr. Rajesh Sharma",
            phone="+91 94443 34567"
        )
        # 4. Subject Faculty
        user_sub_fac = models.User(
            email="faculty.anita@engineering.edu",
            username="FAC02",
            hashed_password=get_password_hash("Faculty@123"),
            role_id=roles_map["subject_faculty"].id,
            full_name="Prof. Anita George",
            phone="+91 94444 45678"
        )
        # 5. Guest Lecturer
        user_guest = models.User(
            email="guest.lecturer@engineering.edu",
            username="GUEST01",
            hashed_password=get_password_hash("Guest@123"),
            role_id=roles_map["guest"].id,
            full_name="Dr. Marcus Vance",
            phone="+91 94445 56789"
        )
        # 6. Admin
        user_admin = models.User(
            email="admin@engineering.edu",
            username="ADMIN01",
            hashed_password=get_password_hash("Admin@123"),
            role_id=roles_map["admin"].id,
            full_name="Mr. Venkat Subramanian",
            phone="+91 94446 67890"
        )
        # 7. Student (Arun Kumar)
        user_student1 = models.User(
            email="student101@engineering.edu",
            username="2024CS101",
            hashed_password=get_password_hash("Student@123"),
            role_id=roles_map["student"].id,
            full_name="Arun Kumar",
            phone="+91 98401 11223"
        )
        # 8. Student (Priya Raman)
        user_student2 = models.User(
            email="student205@engineering.edu",
            username="2023CS205",
            hashed_password=get_password_hash("Student@123"),
            role_id=roles_map["student"].id,
            full_name="Priya Raman",
            phone="+91 98402 22334"
        )
        # 9. Parent (Ramesh Kumar - Father of Arun)
        user_parent = models.User(
            email="parent.ramesh@gmail.com",
            username="PARENT_2024CS101",
            hashed_password=get_password_hash("Parent@123"),
            role_id=roles_map["parent"].id,
            full_name="Ramesh Kumar",
            phone="+91 98401 23456"
        )
        db.add_all([
            user_dean, user_hod, user_prof, user_sub_fac,
            user_guest, user_admin, user_student1, user_student2, user_parent
        ])
        db.flush()

        # Faculty Profiles
        fac_hod = models.Faculty(
            user_id=user_hod.id,
            employee_id="EMP_CSE_001",
            department_id=dept_map["CSE"].id,
            designation="Professor & Head",
            qualification="Ph.D. in Computer Science",
            specialization="Distributed Computing & Cloud",
            joining_date=date(2010, 5, 10),
            is_hod=True
        )
        fac_prof = models.Faculty(
            user_id=user_prof.id,
            employee_id="EMP_CSE_008",
            department_id=dept_map["CSE"].id,
            designation="Associate Professor",
            qualification="Ph.D. in Operating Systems",
            specialization="System Architecture & OS Security",
            joining_date=date(2014, 8, 12),
            is_hod=False
        )
        fac_anita = models.Faculty(
            user_id=user_sub_fac.id,
            employee_id="EMP_CSE_015",
            department_id=dept_map["CSE"].id,
            designation="Assistant Professor",
            qualification="M.Tech CSE",
            specialization="Data Structures & Algorithms",
            joining_date=date(2019, 1, 5),
            is_hod=False
        )
        fac_guest = models.Faculty(
            user_id=user_guest.id,
            employee_id="EMP_GUEST_003",
            department_id=dept_map["CSE"].id,
            designation="Guest Lecturer (Visiting Expert)",
            qualification="Ph.D.",
            specialization="Applied Cryptography",
            joining_date=date(2025, 7, 1),
            is_hod=False
        )
        db.add_all([fac_hod, fac_prof, fac_anita, fac_guest])
        db.flush()

        # Assign HOD to Department
        dept_map["CSE"].hod_faculty_id = fac_hod.id

        # Allocations
        alloc_ds = models.SubjectAllocation(
            subject_id=sub_map["CS301"].id,
            faculty_id=fac_anita.id,
            section_id=sec_a.id,
            academic_year_id=curr_year.id,
            semester_id=sem3.id,
            is_primary=True
        )
        alloc_os = models.SubjectAllocation(
            subject_id=sub_map["CS303"].id,
            faculty_id=fac_prof.id,
            section_id=sec_a.id,
            academic_year_id=curr_year.id,
            semester_id=sem3.id,
            is_primary=True
        )
        alloc_db = models.SubjectAllocation(
            subject_id=sub_map["CS302"].id,
            faculty_id=fac_hod.id,
            section_id=sec_a.id,
            academic_year_id=curr_year.id,
            semester_id=sem3.id,
            is_primary=True
        )
        db.add_all([alloc_ds, alloc_os, alloc_db])
        db.flush()

        # Student Profiles
        student1 = models.Student(
            user_id=user_student1.id,
            roll_number="2024CS101",
            registration_number="312424104001",
            department_id=dept_map["CSE"].id,
            program_id=prog_cse_ug.id,
            batch_id=batch_2024_28.id,
            current_semester_id=sem3.id,
            section_id=sec_a.id,
            dob=date(2005, 4, 18),
            gender="Male",
            blood_group="O+",
            college_email="student101@engineering.edu",
            phone="+91 98401 11223",
            residential_address="Flat 4B, Emerald Residency, Chennai, TN - 600025",
            admission_status="CONFIRMED",
            academic_status="ACTIVE",
            admission_date=date(2024, 8, 1)
        )
        student2 = models.Student(
            user_id=user_student2.id,
            roll_number="2023CS205",
            registration_number="312423104052",
            department_id=dept_map["CSE"].id,
            program_id=prog_cse_ug.id,
            batch_id=batch_2024_28.id,
            current_semester_id=sem3.id,
            section_id=sec_a.id,
            dob=date(2004, 9, 22),
            gender="Female",
            blood_group="B+",
            college_email="student205@engineering.edu",
            phone="+91 98402 22334",
            residential_address="No. 12, Park View Enclave, Chennai, TN - 600040",
            admission_status="CONFIRMED",
            academic_status="ACTIVE",
            admission_date=date(2023, 8, 1)
        )
        db.add_all([student1, student2])
        db.flush()

        # Link Parent
        pg_ramesh = models.ParentGuardian(
            student_id=student1.id,
            user_id=user_parent.id,
            relation_type="FATHER",
            full_name="Ramesh Kumar",
            occupation="Civil Engineer",
            phone="+91 98401 23456",
            email="parent.ramesh@gmail.com",
            address="Flat 4B, Emerald Residency, Chennai",
            is_primary_contact=True
        )
        db.add(pg_ramesh)

        # Student Contact Diary for Arun Kumar
        contacts_data = [
            ("PARENT", "Ramesh Kumar", "Father", "+91 98401 23456", "parent.ramesh@gmail.com", False, "Primary emergency contact"),
            ("EMERGENCY", "Dr. S. Balaji", "Family Physician", "+91 98402 34567", "dr.balaji@clinic.org", False, "Apollo Clinics"),
            ("FRIEND", "Karthik Subramanian", "Hostel Roommate & Peer", "+91 98403 45678", "karthik.s@gmail.com", True, "Consented to show in directory"),
            ("FACULTY", "Prof. Anita George", "Course Faculty (DS)", "+91 94444 45678", "faculty.anita@engineering.edu", True, "Office Hours: 3-5 PM Tue/Thu"),
            ("DEPT_OFFICE", "CSE Department Helpdesk", "Academic Office", "+91 44 2250 1234", "cse.office@engineering.edu", True, "Room 302, Academic Block 1")
        ]
        for cat, name, rel, ph, em, is_pub, notes in contacts_data:
            sc = models.StudentContact(
                student_id=student1.id,
                category=cat,
                name=name,
                relationship=rel,
                phone=ph,
                email=em,
                is_public_in_directory=is_pub,
                notes=notes
            )
            db.add(sc)

        # Enrollments
        for code, subj in sub_map.items():
            enr = models.StudentEnrollment(
                student_id=student1.id,
                subject_id=subj.id,
                semester_id=sem3.id,
                academic_year_id=curr_year.id,
                enrollment_status="ENROLLED"
            )
            db.add(enr)

        # Attendance Sessions & Records (CS301 = 88% attendance, CS303 = 68% attendance to test alerts)
        # Subject CS301 (Data Structures)
        for d in range(1, 11):
            sess = models.AttendanceSession(
                subject_allocation_id=alloc_ds.id,
                session_date=date(2025, 9, d),
                period_number=1,
                topic_covered=f"Data Structures Unit 2: Lecture {d}",
                conducted_by_faculty_id=fac_anita.id,
                is_locked=True
            )
            db.add(sess)
            db.flush()
            rec = models.AttendanceRecord(
                session_id=sess.id,
                student_id=student1.id,
                status="PRESENT" if d != 7 else "ABSENT"
            )
            db.add(rec)

        # Subject CS303 (Operating Systems) - lower attendance
        for d in range(1, 11):
            sess = models.AttendanceSession(
                subject_allocation_id=alloc_os.id,
                session_date=date(2025, 9, d),
                period_number=3,
                topic_covered=f"OS Processes & Threads: Lecture {d}",
                conducted_by_faculty_id=fac_prof.id,
                is_locked=True
            )
            db.add(sess)
            db.flush()
            # 6 present, 4 absent = 60% attendance (triggers low attendance alert!)
            rec = models.AttendanceRecord(
                session_id=sess.id,
                student_id=student1.id,
                status="PRESENT" if d in [1, 2, 4, 6, 8, 9] else "ABSENT"
            )
            db.add(rec)

        # Internal Assessment Marks for Arun Kumar
        m1 = models.Mark(
            student_id=student1.id,
            subject_id=sub_map["CS301"].id,
            assessment_type_id=assess_map["IA1"].id,
            semester_id=sem3.id,
            marks_obtained=88.5,
            is_submitted=True,
            is_approved=True,
            remarks="Excellent problem-solving in trees and graphs"
        )
        m2 = models.Mark(
            student_id=student1.id,
            subject_id=sub_map["CS302"].id,
            assessment_type_id=assess_map["IA1"].id,
            semester_id=sem3.id,
            marks_obtained=82.0,
            is_submitted=True,
            is_approved=True,
            remarks="Good SQL query design"
        )
        m3 = models.Mark(
            student_id=student1.id,
            subject_id=sub_map["CS303"].id,
            assessment_type_id=assess_map["IA1"].id,
            semester_id=sem3.id,
            marks_obtained=68.0,
            is_submitted=True,
            is_approved=True,
            remarks="Needs improvement in CPU scheduling algorithms"
        )
        db.add_all([m1, m2, m3])

        # College Announcements
        ann1 = models.Announcement(
            title="Internal Assessment 2 Schedule Released",
            content="Internal Assessment 2 for all UG & PG programs commences on October 15. The detailed timetable is accessible in your department portal.",
            target_role="ALL",
            department_id=None,
            posted_by_user_id=user_admin.id,
            is_pinned=True
        )
        ann2 = models.Announcement(
            title="Important: Minimum 75% Attendance Requirement",
            content="As per institutional academic regulations, students with attendance below 75% in any course will not be permitted to write the end-semester examination.",
            target_role="STUDENT",
            department_id=None,
            posted_by_user_id=user_dean.id,
            is_pinned=True
        )
        ann3 = models.Announcement(
            title="TechSymposium 2026 Paper Submission Deadline",
            content="Call for papers for the National Conference on Cloud Computing and Artificial Intelligence. Last date for abstract submission: Nov 30.",
            target_role="ALL",
            department_id=dept_map["CSE"].id,
            posted_by_user_id=user_hod.id,
            is_pinned=False
        )
        db.add_all([ann1, ann2, ann3])

        # Student Notifications for Arun Kumar
        notif1 = models.Notification(
            user_id=user_student1.id,
            title="Low Attendance Alert in Operating Systems",
            message="Your current attendance in Operating Systems (CS303) is 60.0%, which is below the mandatory 75% requirement. Please meet Prof. Sharma.",
            category="ATTENDANCE_ALERT",
            is_read=False,
            action_url="/attendance"
        )
        notif2 = models.Notification(
            user_id=user_student1.id,
            title="IA1 Results Published",
            message="Marks for Internal Assessment 1 have been approved by HOD and published. Check your marks section.",
            category="MARKS_UPDATE",
            is_read=True,
            action_url="/marks"
        )
        db.add_all([notif1, notif2])

        db.commit()
        print("[✓] Seed data created successfully!")

    except Exception as e:
        db.rollback()
        print(f"[!] Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
