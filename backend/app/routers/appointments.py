from app.models.user import RoleEnum
from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCreatePublic,
    AppointmentCreateAdmin,
    AppointmentUpdateStatus,
    AppointmentReschedule,
    OverlapCheckRequest,
    OverlapCheckResponse,
    AppointmentResponse
)
from app.services.booking_service import BookingService
from app.services.auth_service import require_roles, get_current_user
from app.services.audit_service import AuditService

router = APIRouter(prefix="/appointments", tags=["Appointment & Booking Management"])

@router.get("/my-bookings", response_model=List[AppointmentResponse])
def get_my_bookings(
    phone: str = Query(..., description="Số điện thoại khách hàng tra cứu"),
    db: Session = Depends(get_db)
):
    """Tra cứu lịch sử đặt lịch công khai dành cho khách hàng qua số điện thoại."""
    clean_phone = phone.strip()
    customer = db.query(Customer).filter(Customer.phone == clean_phone).first()
    if not customer:
        return []

    appointments = db.query(Appointment).filter(
        Appointment.customer_id == customer.id
    ).order_by(Appointment.appointment_date.desc()).all()

    results = []
    for app in appointments:
        resp = AppointmentResponse.model_validate(app)
        resp.has_invoice = (app.invoice is not None)
        results.append(resp)
    return results


@router.post("/public-cancel/{appointment_id}", response_model=AppointmentResponse)
def public_cancel_appointment(
    appointment_id: int,
    phone: str = Query(..., description="Số điện thoại xác thực"),
    db: Session = Depends(get_db)
):
    """Khách hàng tự hủy lịch hẹn nếu chưa hoàn tất và số điện thoại trùng khớp."""
    app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch hẹn")
    if not app.customer or app.customer.phone != phone.strip():
        raise HTTPException(status_code=403, detail="Số điện thoại không khớp với thông tin đặt lịch")
    if app.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Lịch hẹn đã hoàn thành hoặc đã bị hủy trước đó")

    app.status = AppointmentStatus.CANCELLED
    db.commit()
    db.refresh(app)
    resp = AppointmentResponse.model_validate(app)
    resp.has_invoice = (app.invoice is not None)
    return resp


@router.post("/check-overlap", response_model=OverlapCheckResponse)
def check_overlap(
    request: OverlapCheckRequest,
    db: Session = Depends(get_db)
):
    """Check if stylist is working and whether the requested appointment time slot conflicts with existing appointments."""
    return BookingService.check_overlap(
        db=db,
        hairdresser_id=request.hairdresser_id,
        start_time=request.appointment_date,
        service_ids=request.service_ids,
        exclude_appointment_id=request.exclude_appointment_id
    )

@router.get("/available-slots", response_model=List[str])
def get_available_slots(
    hairdresser_id: int = Query(..., description="ID của thợ làm tóc"),
    target_date: str = Query(..., description="Ngày đặt lịch dạng YYYY-MM-DD"),
    duration_minutes: int = Query(45, description="Tổng thời lượng dịch vụ tính bằng phút"),
    db: Session = Depends(get_db)
):
    """Get list of free time slots for a stylist on a specific date."""
    try:
        dt = datetime.strptime(target_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Định dạng ngày không hợp lệ (YYYY-MM-DD)")

    return BookingService.generate_available_slots(
        db=db,
        hairdresser_id=hairdresser_id,
        target_date=dt,
        duration_minutes=duration_minutes
    )

@router.post("/book", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def public_book_appointment(
    booking_data: AppointmentCreatePublic,
    db: Session = Depends(get_db)
):
    """Public booking endpoint for guest customers without needing to log in."""
    app = BookingService.create_public_booking(db, booking_data)
    # Check invoice presence
    resp = AppointmentResponse.model_validate(app)
    resp.has_invoice = False
    return resp

@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def admin_create_appointment(
    booking_data: AppointmentCreateAdmin,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST]))
):
    """Create appointment internally by staff."""
    app = BookingService.create_admin_booking(db, booking_data, user_id=current_user.id)
    resp = AppointmentResponse.model_validate(app)
    resp.has_invoice = False
    return resp

@router.get("/", response_model=List[AppointmentResponse])
def get_appointments(
    start_date: Optional[str] = Query(None, description="Lọc từ ngày YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Lọc đến ngày YYYY-MM-DD"),
    hairdresser_id: Optional[int] = Query(None, description="Lọc theo thợ"),
    customer_id: Optional[int] = Query(None, description="Lọc theo khách hàng"),
    status: Optional[AppointmentStatus] = Query(None, description="Lọc theo trạng thái"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST, RoleEnum.HAIRDRESSER]))
):
    """List appointments with filtering. Stylists only see their own appointments unless admin/receptionist."""
    query = db.query(Appointment)

    # Stylist restriction if not admin/receptionist
    if current_user.role and current_user.role.name == "hairdresser":
        if current_user.hairdresser:
            query = query.filter(Appointment.hairdresser_id == current_user.hairdresser.id)

    if hairdresser_id:
        query = query.filter(Appointment.hairdresser_id == hairdresser_id)

    if customer_id:
        query = query.filter(Appointment.customer_id == customer_id)

    if status:
        query = query.filter(Appointment.status == status)

    if start_date:
        try:
            s_dt = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Appointment.appointment_date >= s_dt)
        except ValueError:
            pass

    if end_date:
        try:
            e_dt = datetime.strptime(f"{end_date} 23:59:59", "%Y-%m-%d %H:%M:%S")
            query = query.filter(Appointment.appointment_date <= e_dt)
        except ValueError:
            pass

    appointments = query.order_by(Appointment.appointment_date.desc()).all()

    # Enhance with invoice boolean
    results = []
    for app in appointments:
        resp = AppointmentResponse.model_validate(app)
        resp.has_invoice = (app.invoice is not None)
        results.append(resp)

    return results

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST]))
):
    app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch hẹn")

    # Stylist restriction check
    if current_user.role and current_user.role.name == "hairdresser":
        if current_user.hairdresser and app.hairdresser_id != current_user.hairdresser.id:
            raise HTTPException(status_code=403, detail="Bạn chỉ có quyền xem lịch hẹn của mình")

    resp = AppointmentResponse.model_validate(app)
    resp.has_invoice = (app.invoice is not None)
    return resp

@router.put("/{appointment_id}/status", response_model=AppointmentResponse)
def update_appointment_status(
    appointment_id: int,
    status_update: AppointmentUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST]))
):
    """Update appointment status (CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED)."""
    app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch hẹn")

    old_status = app.status
    app.status = status_update.status
    db.commit()
    db.refresh(app)

    AuditService.log(
        db=db,
        action="UPDATE_APPOINTMENT_STATUS",
        entity_name="Appointment",
        entity_id=app.id,
        user_id=current_user.id,
        details=f"Cập nhật trạng thái lịch hẹn #{app.id} từ {old_status.value} -> {app.status.value}"
    )

    resp = AppointmentResponse.model_validate(app)
    resp.has_invoice = (app.invoice is not None)
    return resp

@router.put("/{appointment_id}/reschedule", response_model=AppointmentResponse)
def reschedule_appointment(
    appointment_id: int,
    reschedule_data: AppointmentReschedule,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST]))
):
    """Reschedule date/time or stylist for an appointment."""
    app = BookingService.reschedule_appointment(db, appointment_id, reschedule_data, user_id=current_user.id)
    resp = AppointmentResponse.model_validate(app)
    resp.has_invoice = (app.invoice is not None)
    return resp

@router.post("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST]))
):
    """Cancel an appointment."""
    app = BookingService.cancel_appointment(db, appointment_id, user_id=current_user.id)
    resp = AppointmentResponse.model_validate(app)
    resp.has_invoice = (app.invoice is not None)
    return resp
