from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.user import User
from app.api.deps import get_current_user, RoleChecker

router = APIRouter()


@router.get("")
def get_audit_logs(
    limit: int = 50,
    current_user: User = Depends(RoleChecker(["dean", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Dean and Admin institution-level audit log access:
    Records every critical action, student lookup, contact access, and grade modification.
    """
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()

    results = []
    for l in logs:
        user_name = db.query(User).filter(User.id == l.user_id).first()
        results.append({
            "id": l.id,
            "user_name": user_name.full_name if user_name else "System Process",
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "timestamp": str(l.timestamp)
        })
    return results
