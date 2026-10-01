from datetime import datetime, timezone
import string
import random
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.payment import Payment
from app.models.invoice import Invoice, PaymentStatus
from app.models.appointment import Appointment, AppointmentStatus
from app.models.history import ServiceHistory
from app.schemas.payment import PaymentCreate
from app.services.audit_service import AuditService

class PaymentService:
    @staticmethod
    def process_payment(
        db: Session,
        payment_data: PaymentCreate,
        user_id: Optional[int] = None
    ) -> Payment:
        # 1. Validate Invoice
        invoice = db.query(Invoice).filter(Invoice.id == payment_data.invoice_id).first()
        if not invoice:
            raise HTTPException(status_code=404, detail="Hóa đơn không tồn tại")
        
        if invoice.payment_status == PaymentStatus.PAID:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hóa đơn này đã được thanh toán hoàn tất"
            )

        appointment = invoice.appointment

        # 2. Prevent duplicate successful payments processing
        existing_payment = db.query(Payment).filter(
            Payment.invoice_id == invoice.id,
            Payment.payment_status == PaymentStatus.PAID
        ).first()
        if existing_payment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Đã tồn tại giao dịch thanh toán thành công cho hóa đơn này"
            )

        # 3. Handle Transaction Code
        tx_code = payment_data.transaction_code
        if not tx_code:
            chars = string.ascii_uppercase + string.digits
            rand_str = ''.join(random.choices(chars, k=8))
            tx_code = f"TXN-{invoice.id}-{rand_str}"

        # 4. Create Payment Record
        new_payment = Payment(
            invoice_id=invoice.id,
            amount=payment_data.amount,
            payment_method=payment_data.payment_method,
            payment_status=payment_data.payment_status or PaymentStatus.UNPAID,
            transaction_code=tx_code,
            created_at=datetime.now(timezone.utc)
        )
        
        # 5. Determine success/fail
        if new_payment.payment_status == PaymentStatus.PAID:
            # Payment success -> Update invoice, appointment, and history
            if payment_data.amount < invoice.final_amount:
                # Require full amount
                new_payment.payment_status = PaymentStatus.FAILED
                db.add(new_payment)
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Số tiền thanh toán ({payment_data.amount}) nhỏ hơn thực thu ({invoice.final_amount})"
                )
            
            new_payment.paid_at = datetime.now(timezone.utc)
            invoice.payment_status = PaymentStatus.PAID
            invoice.payment_method = new_payment.payment_method
            appointment.status = AppointmentStatus.COMPLETED

            # Create Service History
            # Check if history already exists
            existing_history = db.query(ServiceHistory).filter(ServiceHistory.appointment_id == appointment.id).first()
            if not existing_history:
                service_names_list = [s.service.name for s in appointment.appointment_services if s.service]
                service_names_str = ", ".join(service_names_list) if service_names_list else "Dịch vụ salon"
                
                history_entry = ServiceHistory(
                    customer_id=appointment.customer_id,
                    hairdresser_id=appointment.hairdresser_id,
                    appointment_id=appointment.id,
                    service_names=service_names_str,
                    formula_or_color_code=invoice.formula_or_color_code,
                    notes=invoice.technician_notes or appointment.notes,
                    cost=invoice.final_amount,
                    completed_at=datetime.now(timezone.utc)
                )
                db.add(history_entry)
        else:
            # FAILED or UNPAID payment attempt
            pass

        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)

        # 6. Audit
        AuditService.log(
            db=db,
            action="PROCESS_PAYMENT",
            entity_name="Payment",
            entity_id=new_payment.id,
            user_id=user_id,
            details=f"Xử lý thanh toán hóa đơn #{invoice.id}, trạng thái: {new_payment.payment_status.value}"
        )

        return new_payment
