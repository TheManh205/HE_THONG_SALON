from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.invoice import PaymentMethod, PaymentStatus

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.UNPAID)
    transaction_code = Column(String(100), unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)

    invoice = relationship("Invoice", back_populates="payments")
