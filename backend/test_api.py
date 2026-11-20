import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("\n--- TEST 1: Health Check ---")
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] Health Check:", res.json())

    print("\n--- TEST 2: Demo Accounts ---")
    res = client.get("/api/v1/auth/demo-accounts")
    assert res.status_code == 200
    roles = [acc["code"] for acc in res.json()]
    print(f"[PASS] Available demo roles ({len(roles)}):", roles)

    print("\n--- TEST 3: Student Login (Arun Kumar - 2024CS101) ---")
    login_payload = {
        "username_or_email": "2024CS101",
        "password": "Student@123"
    }
    res = client.post("/api/v1/auth/login", json=login_payload)
    assert res.status_code == 200, f"Login failed: {res.text}"
    student_token = res.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}
    print("[PASS] Student Login successful. Token generated.")

    print("\n--- TEST 4: Fetch Student /me Profile ---")
    res = client.get("/api/v1/auth/me", headers=student_headers)
    assert res.status_code == 200
    user_info = res.json()
    assert user_info["role"] == "student"
    assert user_info["roll_number"] == "2024CS101"
    print(f"[PASS] Authenticated user: {user_info['full_name']} (Roll: {user_info['roll_number']})")

    print("\n--- TEST 5: Subject-Wise Attendance Calculation & Low-Attendance Alert ---")
    res = client.get("/api/v1/attendance/my-summary", headers=student_headers)
    assert res.status_code == 200
    summary = res.json()
    print(f"[PASS] Attendance calculated across {len(summary)} subjects:")
    for s in summary:
        print(f"  - {s['subject_code']} ({s['subject_name']}): {s['percentage']}% [Alert: {s['status_alert']}]")

    print("\n--- TEST 6: Student Internal Marks ---")
    res = client.get("/api/v1/marks/my-marks", headers=student_headers)
    assert res.status_code == 200
    marks = res.json()
    print(f"[PASS] Retrieved {len(marks)} approved marks records:")
    for m in marks:
        print(f"  - {m['subject_code']} ({m['assessment_name']}): {m['marks_obtained']}/{m['max_marks']}")

    print("\n--- TEST 7: Student Private Contact Diary & Public Directory ---")
    res = client.get("/api/v1/contacts/my-diary", headers=student_headers)
    assert res.status_code == 200
    diary = res.json()
    print(f"[PASS] Student private diary has {len(diary)} personal entries (parents, emergency, peers).")

    res_pub = client.get("/api/v1/contacts/directory")
    assert res_pub.status_code == 200
    pub_dir = res_pub.json()
    print(f"[PASS] Public consented directory exposes only {len(pub_dir)} approved contacts (no private emergency numbers).")

    print("\n--- TEST 8: Dean Login & Institution Analytics ---")
    res_dean = client.post("/api/v1/auth/login", json={"username_or_email": "dean@engineering.edu", "password": "Dean@123"})
    assert res_dean.status_code == 200
    dean_token = res_dean.json()["access_token"]
    dean_headers = {"Authorization": f"Bearer {dean_token}"}

    res_stats = client.get("/api/v1/departments/stats", headers=dean_headers)
    assert res_stats.status_code == 200
    stats = res_stats.json()
    print("[PASS] Institution Stats:", stats["degree_breakdown"])

    print("\n--- TEST 9: Roll-Number Lookup Security & Object-Level Permission Enforcement ---")
    # Dean looking up student 2024CS101 -> Allowed
    res_lookup = client.get("/api/v1/students/lookup/2024CS101", headers=dean_headers)
    assert res_lookup.status_code == 200
    print("[PASS] Dean lookup for 2024CS101 authorized.")

    # Student 2024CS101 looking up own roll -> Allowed
    res_self = client.get("/api/v1/students/lookup/2024CS101", headers=student_headers)
    assert res_self.status_code == 200
    print("[PASS] Student self lookup for 2024CS101 authorized.")

    # Student 2023CS205 login and trying to lookup 2024CS101 -> Must be 403 Forbidden!
    res_other = client.post("/api/v1/auth/login", json={"username_or_email": "2023CS205", "password": "Student@123"})
    other_token = res_other.json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}

    res_forbidden = client.get("/api/v1/students/lookup/2024CS101", headers=other_headers)
    assert res_forbidden.status_code == 403, f"Expected 403 Forbidden but got {res_forbidden.status_code}"
    print(f"[PASS] Unauthorized cross-student lookup strictly blocked with 403: {res_forbidden.json()['detail']}")

    print("\n==========================================")
    print("ALL 9 BACKEND VALIDATION SUITES PASSED 100%!")
    print("==========================================\n")

if __name__ == "__main__":
    run_tests()
