from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse 
from app.schemas.history import ServiceHistoryResponse
from app.services.customer_service import CustomerService
from app.services.auth_service import require_roles, get_current_user

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("/", response_model=List[CustomerResponse])
def get_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST, RoleEnum.HAIRDRESSER]))
):
    """Lấy danh sách khách hàng (kèm thống kê số lịch hẹn và tổng chi tiêu)."""
    return CustomerService(db).get_customers(skip=skip, limit=limit)

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST, RoleEnum.HAIRDRESSER]))
):
    """Lấy thông tin chi tiết một khách hàng."""
    customer = CustomerService(db).get_customer_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")
    return customer

@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST]))
):
    """Tạo hồ sơ khách hàng mới."""
    return CustomerService(db).create_customer(customer_data)

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST]))
):
    """Cập nhật thông tin khách hàng."""
    customer = CustomerService(db).update_customer(customer_id, customer_data)
    if not customer:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")
    return customer

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
):
    """Xóa khách hàng (Chỉ Admin mới có quyền)."""
    success = CustomerService(db).delete_customer(customer_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")
    return None


@router.get("/{customer_id}/history", response_model=List[ServiceHistoryResponse])
def get_customer_history(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy lịch sử dịch vụ của một khách hàng (áp dụng kiểm soát phân quyền bên trong service)."""
    return CustomerService(db).get_service_history(customer_id, current_user)