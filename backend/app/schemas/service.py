from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int = 45
    price: float
    category: str = "Cắt & Tạo kiểu"
    image_url: Optional[str] = None
    is_active: bool = True

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class ServiceResponse(ServiceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
