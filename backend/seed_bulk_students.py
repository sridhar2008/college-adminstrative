import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.services.student_generator import generate_fictional_students, ensure_departments_and_programs
import app.models as models


def run_bulk_student_seeding(count_per_group: int = 50, phd_years: int = 3):
    print("=================================================================")
    print("  COLLEGE STUDENT MANAGEMENT SYSTEM (CSMS)")
    print("  INSTITUTIONAL BULK STUDENT SEEDING SCRIPT")
    print("=================================================================")
    print(f"[*] Configuration: {count_per_group} students per department per year/program")
    print(f"[*] PhD Research Duration: {phd_years} Years (Configurable)")

    db = SessionLocal()
    try:
        print("[*] Ensuring all 20 engineering departments and programs exist...")
        dept_map = ensure_departments_and_programs(db)
        print(f"[✓] {len(dept_map)} Engineering departments verified:")
        for code, dept in dept_map.items():
            print(f"    - [{code}] {dept.name}")

        print("\n[*] Starting transactional student generation...")
        print("    - Undergraduate (UG): 4 Years (Year 1 to Year 4)")
        print("    - Postgraduate (PG): 2 Years (Year 1 & Year 2)")
        print(f"    - Ph.D. Research Scholars: {phd_years} Configured Research Years")

        result = generate_fictional_students(
            db=db,
            department_id="all",
            degree_level="ALL",
            target_year="ALL",
            count_per_group=count_per_group,
            phd_years=phd_years
        )

        total_students = db.query(models.Student).count()
        total_ug = db.query(models.Student).join(models.Program).filter(models.Program.degree_level == "UG").count()
        total_pg = db.query(models.Student).join(models.Program).filter(models.Program.degree_level == "PG").count()
        total_phd = db.query(models.Student).join(models.Program).filter(models.Program.degree_level == "PhD").count()

        print("\n=================================================================")
        print(f"[✓] Bulk Seeding Complete!")
        print(f"    - Students Created this run: {result['students_created']}")
        print(f"    - Departments Covered: {result['departments_covered']}")
        print(f"    - Total College Students Now in Database: {total_students}")
        print(f"        • UG Students (Years 1-4): {total_ug}")
        print(f"        • PG Students (Years 1-2): {total_pg}")
        print(f"        • Ph.D. Research Scholars: {total_phd}")
        print("=================================================================\n")

    except Exception as e:
        db.rollback()
        print(f"[!] Error during bulk seeding: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    count = 50
    if len(sys.argv) > 1:
        try:
            count = int(sys.argv[1])
        except ValueError:
            pass
    run_bulk_student_seeding(count_per_group=count)
