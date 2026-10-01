from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timezone

from app.models.appointment import Appointment, AppointmentStatus
from app.models.invoice import Invoice, PaymentMethod, PaymentStatus
from app.models.history import ServiceHistory
from app.schemas.invoice import InvoiceCreate
from app.services.audit_service import AuditService

class InvoiceService:
    @staticmethod
    def create_invoice(
        db: Session,
        invoice_data: InvoiceCreate,
        user_id: Optional[int] = None
    ) -> Invoice:
        """Create invoice for appointment (status: UNPAID). Payment must be handled separately."""
        appointment = db.query(Appointment).filter(Appointment.id == invoice_data.appointment_id).first()
        if not appointment:
            raise HTTPException(status_code=404, detail="Lịch hẹn không tồn tại")

        # Check if already has invoice
        existing_invoice = db.query(Invoice).filter(Invoice.appointment_id == appointment.id).first()
        if existing_invoice:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Lịch hẹn này đã được tạo hóa đơn"
            )

        if appointment.status == AppointmentStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không thể tạo hóa đơn cho lịch hẹn đã bị hủy"
            )

        # Calculate final amount
        total_amount = appointment.total_price
        discount = invoice_data.discount_amount or 0.0
        final_amount = max(0.0, total_amount - discount)

        # Create Invoice
        invoice = Invoice(
            appointment_id=appointment.id,
            customer_id=appointment.customer_id,
            total_amount=total_amount,
            discount_amount=discount,
            final_amount=final_amount,
            payment_method=invoice_data.payment_method or PaymentMethod.CASH,
            payment_status=PaymentStatus.UNPAID, # Hardcode to UNPAID initially
            formula_or_color_code=invoice_data.formula_or_color_code,
            technician_notes=invoice_data.technician_notes,
            created_at=datetime.now(timezone.utc)
        )
        db.add(invoice)
        db.commit()
        db.refresh(invoice)

        AuditService.log(
            db=db,
            action="CREATE_INVOICE",
            entity_name="Invoice",
            entity_id=invoice.id,
            user_id=user_id,
            details=f"Tạo hóa đơn #{invoice.id} cho lịch hẹn #{appointment.id}, tổng tiền {final_amount:,.0f} VND"
        )

        return invoice
