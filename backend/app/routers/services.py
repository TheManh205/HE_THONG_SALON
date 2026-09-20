from app.models.user import RoleEnum
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.service import Service
from app.models.user import User
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceResponse
from app.services.auth_service import require_roles

router = APIRouter(prefix="/services", tags=["Services Management"])

@router.get("/", response_model=List[ServiceResponse])
def get_services(
    category: Optional[str] = Query(None, description="Lọc theo danh mục"),
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """List salon services (Publicly accessible)."""
    query = db.query(Service)
    if active_only:
        query = query.filter(Service.is_active == True)
    if category:
        query = query.filter(Service.category == category)
    return query.order_by(Service.category, Service.price).all()

@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Không tìm thấy dịch vụ")
    return service

@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    service_in: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
):
    """Create a new salon service (Admin only)."""
    existing = db.query(Service).filter(Service.name == service_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Dịch vụ với tên này đã tồn tại")

    service = Service(**service_in.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service

@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    service_update: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Không tìm thấy dịch vụ")

    update_data = service_update.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != service.name:
        existing = db.query(Service).filter(Service.name == update_data["name"], Service.id != service_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Tên dịch vụ đã tồn tại")

    for key, value in update_data.items():
        setattr(service, key, value)

    db.commit()
    db.refresh(service)
    return service

@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Không tìm thấy dịch vụ")
    
    # Soft delete / deactivation
    service.is_active = False
    db.commit()
    return None
