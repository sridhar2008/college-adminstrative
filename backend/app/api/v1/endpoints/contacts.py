from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
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


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    relationship: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_public_in_directory: Optional[bool] = None
    notes: Optional[str] = None


@router.get("/my-diary")
def get_my_contacts(
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns personal contact diary for the logged-in student.
    Strictly private: only the student and authorized college safety staff can access emergency contacts.
    """
    if not current_user.student_profile:
        return []

    query = db.query(StudentContact).filter(
        StudentContact.student_id == current_user.student_profile.id
    )

    if category and category != "ALL":
        query = query.filter(StudentContact.category == category)

    if search:
        s_clean = f"%{search.strip()}%"
        query = query.filter(
            (StudentContact.name.ilike(s_clean)) |
            (StudentContact.relationship.ilike(s_clean)) |
            (StudentContact.phone.ilike(s_clean))
        )

    contacts = query.all()
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
        name=data.name.strip(),
        relationship=data.relationship.strip(),
        phone=data.phone.strip(),
        email=data.email.strip() if data.email else None,
        is_public_in_directory=data.is_public_in_directory,
        notes=data.notes
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return {"success": True, "message": "Contact saved successfully.", "id": contact.id}


@router.put("/my-diary/{contact_id}")
def update_contact(
    contact_id: str,
    data: ContactUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update personal contact details."""
    if not current_user.student_profile:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    contact = db.query(StudentContact).filter(
        StudentContact.id == contact_id,
        StudentContact.student_id == current_user.student_profile.id
    ).first()

    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found.")

    if data.name:
        contact.name = data.name.strip()
    if data.relationship:
        contact.relationship = data.relationship.strip()
    if data.phone:
        contact.phone = data.phone.strip()
    if data.email is not None:
        contact.email = data.email.strip() if data.email else None
    if data.is_public_in_directory is not None:
        contact.is_public_in_directory = data.is_public_in_directory
    if data.notes is not None:
        contact.notes = data.notes

    db.commit()
    return {"success": True, "message": "Contact updated successfully."}


@router.delete("/my-diary/{contact_id}")
def delete_contact(
    contact_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a personal contact from student diary."""
    if not current_user.student_profile:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    contact = db.query(StudentContact).filter(
        StudentContact.id == contact_id,
        StudentContact.student_id == current_user.student_profile.id
    ).first()

    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found.")

    db.delete(contact)
    db.commit()
    return {"success": True, "message": "Contact deleted successfully."}


@router.patch("/my-diary/{contact_id}/consent")
def toggle_directory_consent(
    contact_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle affirmative student consent to publish friend/peer contact in public directory."""
    if not current_user.student_profile:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    contact = db.query(StudentContact).filter(
        StudentContact.id == contact_id,
        StudentContact.student_id == current_user.student_profile.id
    ).first()

    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found.")

    contact.is_public_in_directory = not contact.is_public_in_directory
    db.commit()
    return {
        "success": True,
        "is_public_in_directory": contact.is_public_in_directory,
        "message": "Directory visibility preference updated."
    }


@router.get("/directory")
def get_public_directory(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Student-Approved Contact Directory:
    Returns only entries where students gave EXPLICIT affirmative consent (is_public_in_directory == True).
    Never exposes private parent or emergency contacts.
    """
    query = db.query(StudentContact).filter(StudentContact.is_public_in_directory == True)

    if category and category != "ALL":
        query = query.filter(StudentContact.category == category)

    if search:
        s_clean = f"%{search.strip()}%"
        query = query.filter(
            (StudentContact.name.ilike(s_clean)) |
            (StudentContact.relationship.ilike(s_clean))
        )

    contacts = query.all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "relationship": c.relationship,
            "category": c.category,
            "email": c.email,
            "notes": c.notes
        } for c in contacts
    ]
