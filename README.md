# College Student Management System (CSMS)
## Institutional Academic & Administrative ERP for Engineering Colleges

![Architecture](https://img.shields.io/badge/Architecture-3--Tier%20Cloud-blue)
![Backend](https://img.shields.io/badge/Backend-FastAPI%20Python%203.14-green)
![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Tailwind%20CSS-cyan)
![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20SQLAlchemy-indigo)
![Security](https://img.shields.io/badge/Security-JWT%20%2B%20Bcrypt%20%2B%20RBAC-red)

A centralized, responsive, role-based Student Management System built for engineering colleges offering:
1. **Undergraduate (UG)**: 4-Year B.Tech programs (Year 1 to Year 4, Semesters 1 to 8).
2. **Postgraduate (PG)**: 2-Year M.Tech programs (Semesters 1 to 4).
3. **Ph.D. Research**: Configurable doctoral candidate tracking across variable research durations.

Pre-populated with **9,000 realistic fictional student records** across **20 engineering departments**, complete with parent profiles, contact diaries, attendance records, and continuous assessment grading.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    UserClient["Client (Browser / Mobile / Tablet)"] --> ReactApp["React 18 SPA (Tailwind CSS, Recharts)"]
    ReactApp -- "GitHub Pages / Cloudflare Pages" --> WebHost["Static Hosting"]
    ReactApp -- "HTTPS + Bearer JWT" --> FastAPIServer["FastAPI Backend (Render / Railway / AWS)"]
    FastAPIServer --> AuthMiddleware["RBAC & Object-Level Permission Guard"]
    AuthMiddleware --> ORMLayer["SQLAlchemy 2.0 ORM Engine"]
    ORMLayer --> ManagedDB[("Managed PostgreSQL / Local SQLite")]
```

---

## 👥 Role-Based Access Control (RBAC) Matrix

| Role | Scope | Key Capabilities |
| :--- | :--- | :--- |
| **Dean** | Institution-Wide | Comprehensive student strength analytics, department metrics, audit logs |
| **Department HOD** | Assigned Department | Department faculty, subject allocation, marks approval, attendance review |
| **Professor / Faculty** | Assigned Courses | Enter internal assessment marks, record class attendance, student performance |
| **Subject Faculty** | Assigned Sections | Section-wise attendance marking, evaluation, marks submission |
| **Guest Lecturer** | Restricted Sessions | Time-limited read-only access to assigned lecture sessions and course materials |
| **Student** | Personal Record | Subject-wise attendance %, published marks, timetable, contact diary |
| **Admin Staff** | Institutional Registry | Student enrollment, department & program registry, bulk student generator, CSV import/export |
| **Parent / Guardian** | Linked Ward Only | View ward's attendance percentage, published results, college announcements |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python**: Version 3.10+ (Tested on Python 3.14)
- **Node.js**: Version 18+ (Tested on Node.js 22)
- **Git**

---

### 2. Backend Setup (FastAPI + SQLAlchemy)

```bash
# Navigate to the backend directory
cd backend

# Create and activate a Python virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Populate 9,000 fictional students across 20 departments (UG, PG, PhD)
python seed_bulk_students.py

# Run the automated backend verification suite (13 test suites)
python test_api.py

# Launch the FastAPI ASGI server
uvicorn app.main:app --reload --port 8000
```

Once running:
- **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc API Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

### 3. Frontend Setup (React.js + Tailwind CSS)

```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

The portal will open at `http://localhost:5173`.

---

## ⚡ Live Features & Admin Generator

### 1. Student Data Generator (`/admin/student-generator`)
- Filter and generate custom batch sizes per department, program (UG / PG / PhD), and academic year.
- Configurable PhD research year groups (Years 1 to 5+).
- Real-time department statistics breakdown.
- Export generated student lists to CSV directly from the dashboard.
- Safe transactional clearing of sample students without corrupting core system configurations.

### 2. Department & Program Management (`/departments`)
- Manage 20 engineering departments (CSE, IT, AIDS, AIML, CSBS, CYS, ECE, EEE, MECH, etc.).
- Add and modify programs, batches, and semesters dynamically without code edits.

### 3. Attendance Module (`/attendance`)
- Period-wise (Periods 1–8) and daily attendance marking.
- Quick "Mark All Present" shortcut with instant toggle switches (Present, Absent, On Duty, Medical Leave).
- Statutory attendance percentage calculation with automated alerts for students with attendance $< 75\%$.
- Student attendance correction requests with HOD review and approval workflow.

### 4. Continuous Evaluation & Grading (`/marks`)
- Direct entry for Internal Assessments (IA1, IA2, IA3), Assignments, Lab Practicals, and Model Exams.
- Anna University & autonomous grading scale: `O` (91-100), `A+` (81-90), `A` (71-80), `B+` (61-70), `B` (50-60), `RA` (<50).
- Automatic GPA & CGPA calculation upon HOD approval and official publication.

### 5. Private Contact Diary & Public Directory (`/contacts`)
- Categorized personal directory: Parent, Guardian, Emergency, Friend, Faculty, Department Office.
- **Affirmative Consent Safeguard**: Student contacts are strictly private by default; entries only appear in the public directory when explicitly toggled on by the student.

---

## 🔑 Demo Institutional Accounts (One-Click Testing)

All accounts are pre-configured with realistic fictional engineering college data:

| Role | Username / Identifier | Password | Primary Scope |
| :--- | :--- | :--- | :--- |
| **Dean** | `dean@engineering.edu` | `Dean@123` | Institution analytics & audit trail |
| **Department HOD** | `hod.cse@engineering.edu` | `Hod@123` | CSE Department operations |
| **Professor** | `prof.sharma@engineering.edu` | `Faculty@123` | Operating Systems (CS303) |
| **Subject Faculty** | `faculty.anita@engineering.edu` | `Faculty@123` | Data Structures (CS301) |
| **Guest Lecturer** | `guest.lecturer@engineering.edu` | `Guest@123` | Assigned lecture sessions |
| **Student (UG Year 2)**| `2024CS101` | `Student@123` | Arun Kumar (B.Tech CSE Sem 3) |
| **Student (UG Year 3)**| `2023CS205` | `Student@123` | Priya Raman (B.Tech CSE Sem 5) |
| **Admin Staff** | `admin@engineering.edu` | `Admin@123` | Institutional registry, generator & batches |
| **Parent** | `parent.ramesh@gmail.com` | `Parent@123` | Ward Arun Kumar (2024CS101) |

*(Note: On the login page, you can click any of the 8 demo buttons to automatically sign in as that role).*

---

## 🌐 Production Cloud Deployment Guide

### A. Frontend on GitHub Pages
1. Push your repository to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin master
   ```
2. In your GitHub repository settings:
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. In **Settings** > **Secrets and variables** > **Actions**, add a repository secret:
   - Name: `VITE_API_URL`
   - Value: `https://your-backend-service.onrender.com` (your deployed backend URL).
4. Pushing to `master` will automatically trigger `.github/workflows/frontend-deploy.yml`.

### B. Backend on Render / Railway / Fly.io
1. Create a **Web Service** pointing to your repository's `backend` folder.
2. Build Command: `pip install -r requirements.txt && alembic upgrade head`
3. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Environment Variables:
   - `DATABASE_URL`: Your managed PostgreSQL connection URI (e.g., from Neon or Supabase).
   - `JWT_SECRET_KEY`: A high-entropy 256-bit secret string.
   - `CORS_ORIGINS`: `https://<your-username>.github.io`

### C. Managed PostgreSQL (Neon / Supabase / AWS RDS)
1. Provision a free PostgreSQL instance on [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com).
2. Copy the connection string: `postgresql://user:password@host/dbname?sslmode=require`.
3. Set `DATABASE_URL` in your backend environment variables; SQLAlchemy automatically routes queries to PostgreSQL.

---

## 🛡️ Cybersecurity & Privacy Safeguards

1. **Object-Level Authorization**: Roll numbers and IDs are validated against the authenticated session token. Cross-student profile lookups return strict `403 Forbidden`.
2. **Contact Privacy Safeguard**: Parent phone numbers, home addresses, and emergency contacts are strictly private. The public directory only exposes entries where students gave explicit affirmative consent (`is_public_in_directory: true`).
3. **Audit Trail**: Every student lookup, grade alteration, and contact diary access triggers an immutable record in `audit_logs`.
4. **Statutory Attendance Formula**:
   $$\text{Attendance Percentage} = \left(\frac{\text{Classes Attended}}{\text{Conducted Classes}}\right) \times 100$$
   Students with $< 75\%$ attendance are highlighted with visual warning alerts.
