from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.payment import Payment
from app.models.user import User, RoleEnum
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.services.payment_service import PaymentService
from app.services.auth_service import require_roles

router = APIRouter(prefix="/payments", tags=["Payment & Transaction Management"])

@router.get("/", response_model=List[PaymentResponse])
def get_payments(
    invoice_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST]))
):
    """List payments with optional invoice filter."""
    query = db.query(Payment)
    if invoice_id:
        query = query.filter(Payment.invoice_id == invoice_id)
    return query.order_by(Payment.created_at.desc()).all()

@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST]))
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Không tìm thấy giao dịch thanh toán")
    return payment

@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def process_payment(
    payment_in: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST]))
):
    """Process a payment. If successful, updates Invoice, Appointment, and creates Service History."""
    return PaymentService.process_payment(db, payment_in, user_id=current_user.id)
