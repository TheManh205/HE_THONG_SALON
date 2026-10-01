from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.invoice import PaymentMethod, PaymentStatus

class PaymentCreate(BaseModel):
    invoice_id: int
    amount: float
    payment_method: PaymentMethod
    transaction_code: Optional[str] = None
    payment_status: Optional[PaymentStatus] = PaymentStatus.PAID

class PaymentResponse(BaseModel):
    id: int
    invoice_id: int
    amount: float
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    transaction_code: Optional[str] = None
    created_at: datetime
    paid_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
