from typing import Optional
from pydantic import BaseModel


class LoginRequest(BaseModel):
    username_or_email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict


class UserInfo(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    role: str
    role_display: str
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    roll_number: Optional[str] = None
    employee_id: Optional[str] = None
    is_active: bool
