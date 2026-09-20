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
    def create_invoice_and_checkout(
        db: Session,
        invoice_data: InvoiceCreate,
        user_id: Optional[int] = None
    ) -> Invoice:
        """Create invoice for appointment, mark appointment COMPLETED, and record ServiceHistory."""
        appointment = db.query(Appointment).filter(Appointment.id == invoice_data.appointment_id).first()
        if not appointment:
            raise HTTPException(status_code=404, detail="Lịch hẹn không tồn tại")

        # Check if already has invoice
        existing_invoice = db.query(Invoice).filter(Invoice.appointment_id == appointment.id).first()
        if existing_invoice:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Lịch hẹn này đã được tạo hóa đơn và thanh toán trước đó"
            )

        if appointment.status == AppointmentStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không thể thanh toán lịch hẹn đã bị hủy"
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
            payment_status=invoice_data.payment_status or PaymentStatus.PAID,
            created_at=datetime.now(timezone.utc)
        )
        db.add(invoice)

        # Mark appointment COMPLETED
        appointment.status = AppointmentStatus.COMPLETED

        # Create ServiceHistory entry
        service_names_list = [s.service.name for s in appointment.appointment_services if s.service]
        service_names_str = ", ".join(service_names_list) if service_names_list else "Dịch vụ salon"

        history_entry = ServiceHistory(
            customer_id=appointment.customer_id,
            hairdresser_id=appointment.hairdresser_id,
            appointment_id=appointment.id,
            service_names=service_names_str,
            formula_or_color_code=invoice_data.formula_or_color_code,
            notes=invoice_data.technician_notes or appointment.notes,
            cost=final_amount,
            completed_at=datetime.now(timezone.utc)
        )
        db.add(history_entry)

        db.commit()
        db.refresh(invoice)

        AuditService.log(
            db=db,
            action="CREATE_INVOICE_CHECKOUT",
            entity_name="Invoice",
            entity_id=invoice.id,
            user_id=user_id,
            details=f"Thanh toán hóa đơn #{invoice.id} cho lịch hẹn #{appointment.id}, tổng tiền {final_amount:,.0f} VND"
        )

        return invoice
