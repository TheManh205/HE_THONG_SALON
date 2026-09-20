from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.invoice import PaymentMethod, PaymentStatus

class InvoiceCreate(BaseModel):
    appointment_id: int
    discount_amount: Optional[float] = 0.0
    payment_method: Optional[PaymentMethod] = PaymentMethod.CASH
    payment_status: Optional[PaymentStatus] = PaymentStatus.PAID
    formula_or_color_code: Optional[str] = None
    technician_notes: Optional[str] = None

class InvoiceResponse(BaseModel):
    id: int
    appointment_id: int
    customer_id: int
    total_amount: float
    discount_amount: float
    final_amount: float
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
