from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
import app.models  # Ensure all SQLAlchemy models are imported for metadata creation
from app.api.v1.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize all database tables automatically if they don't already exist
    Base.metadata.create_all(bind=engine)
    yield
    # Teardown logic if needed


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
# College Student Management System (CSMS) API
Comprehensive REST API for Engineering Colleges supporting:
* **Multi-Tier Academics**: Undergraduate (UG 4-Year), Postgraduate (PG 2-Year), and Ph.D. Scholars
* **Strict Role-Based Access Control**: Dean, Department HOD, Faculty, Subject Faculty, Guest Lecturer, Student, Admin Staff, Parent
* **Attendance Engine**: Daily & period-wise marking, percentage calculations, low-attendance alerts (<75%)
* **Configurable Assessment System**: Internal Assessments (IA1, IA2, IA3), Assignments, Lab Practicals, Model Exams
* **Student Privacy Diary**: Fine-grained consent, private guardian & emergency contacts, public student directory
* **Institutional Audit Trail**: Server-side access logging & object-level permission enforcement
    """,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure Cross-Origin Resource Sharing (CORS) for React Frontend
origins = settings.BACKEND_CORS_ORIGINS
if isinstance(origins, str):
    origins = [origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Central API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health & Status"])
def root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "api_docs": "/docs",
        "health_check": "/health"
    }


@app.get("/health", tags=["Health & Status"])
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "environment": settings.ENVIRONMENT
    }
