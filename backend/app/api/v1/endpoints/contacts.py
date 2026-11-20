from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.student import StudentContact, Student
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()


class ContactCreate(BaseModel):
    category: str  # PARENT, GUARDIAN, EMERGENCY, FRIEND, FACULTY, DEPT_OFFICE, ADMIN_OFFICE
    name: str
    relationship: str
    phone: str
    email: Optional[str] = None
    is_public_in_directory: bool = False
    notes: Optional[str] = None


@router.get("/my-diary")
def get_my_contacts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns personal contact diary for the logged-in student.
    Strictly private: only the student and authorized college safety staff can access emergency contacts.
    """
    if not current_user.student_profile:
        return []

    contacts = db.query(StudentContact).filter(
        StudentContact.student_id == current_user.student_profile.id
    ).all()

    return [
        {
            "id": c.id,
            "category": c.category,
            "name": c.name,
            "relationship": c.relationship,
            "phone": c.phone,
            "email": c.email,
            "is_public_in_directory": c.is_public_in_directory,
            "notes": c.notes
        } for c in contacts
    ]


@router.post("/my-diary")
def add_contact(
    data: ContactCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allows student to add personal contacts with explicit privacy consent flag."""
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can manage personal contact diaries."
        )

    contact = StudentContact(
        student_id=current_user.student_profile.id,
        category=data.category,
        name=data.name,
        relationship=data.relationship,
        phone=data.phone,
        email=data.email,
        is_public_in_directory=data.is_public_in_directory,
        notes=data.notes
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return {"success": True, "message": "Contact saved successfully", "id": contact.id}


@router.get("/directory")
def get_public_directory(db: Session = Depends(get_db)):
    """
    Student-Approved Contact Directory:
    Returns only entries where students gave EXPLICIT consent (is_public_in_directory == True).
    Never exposes private parent or emergency contacts.
    """
    contacts = db.query(StudentContact).filter(
        StudentContact.is_public_in_directory == True
    ).all()

    return [
        {
            "name": c.name,
            "relationship": c.relationship,
            "category": c.category,
            "email": c.email,
            "notes": c.notes
        } for c in contacts
    ]
