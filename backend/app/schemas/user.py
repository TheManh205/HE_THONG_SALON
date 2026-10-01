from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator

class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role_id: int
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    is_active: bool
    role_id: int
    role: Optional[str] = None
    created_at: datetime

    @field_validator('role', mode='before')
    @classmethod
    def extract_role_name(cls, v: Any) -> Optional[str]:
        if hasattr(v, 'name'):
            return v.name
        if isinstance(v, str):
            return v
        return None

    model_config = ConfigDict(from_attributes=True)
