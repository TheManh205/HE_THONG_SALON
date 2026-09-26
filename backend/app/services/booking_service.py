from datetime import datetime, timedelta, time
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException, status

from app.models.customer import Customer
from app.models.hairdresser import Hairdresser, Schedule
from app.models.service import Service, AppointmentService
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.appointment import (
    AppointmentCreatePublic,
    AppointmentCreateAdmin,
    AppointmentReschedule,
    OverlapCheckResponse
)
from app.services.audit_service import AuditService

class BookingService:
    @staticmethod
    def calculate_booking_duration_and_price(db: Session, service_ids: List[int]) -> Tuple[int, float, List[Service]]:
        """Calculate total duration in minutes, total price, and return list of valid services."""
        if not service_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vui lòng chọn ít nhất một dịch vụ"
            )
        
        services = db.query(Service).filter(
            Service.id.in_(service_ids),
            Service.is_active == True
        ).all()

        if len(services) != len(set(service_ids)):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Một hoặc nhiều dịch vụ đã chọn không tồn tại hoặc đã ngừng phục vụ"
            )
        
        total_duration = sum(s.duration_minutes for s in services)
        total_price = sum(s.price for s in services)
        return total_duration, total_price, services

    @staticmethod
    def get_stylist_schedule_for_date(db: Session, hairdresser_id: int, target_date: datetime) -> Optional[Schedule]:
        """Fetch working schedule for a stylist on target date's day-of-week (0=Mon, 6=Sun)."""
        day_of_week = target_date.weekday()
        # First check for a daily override
        from app.models.hairdresser import DailySchedule
        ds = db.query(DailySchedule).filter(
            DailySchedule.hairdresser_id == hairdresser_id,
            DailySchedule.schedule_date == target_date.date()
        ).first()
        if ds:
            # Build a lightweight Schedule-like object
            class _S:
                def __init__(self, start_time, end_time, is_day_off):
                    self.start_time = start_time
                    self.end_time = end_time
                    self.is_day_off = is_day_off

            return _S(ds.start_time, ds.end_time, ds.is_day_off)

        schedule = db.query(Schedule).filter(
            Schedule.hairdresser_id == hairdresser_id,
            Schedule.day_of_week == day_of_week
        ).first()
        return schedule

    @staticmethod
    def generate_available_slots(
        db: Session,
        hairdresser_id: int,
        target_date: datetime,
        duration_minutes: int,
        exclude_appointment_id: Optional[int] = None
    ) -> List[str]:
        """Generate free time slots for a stylist on a specific date."""
        schedule = BookingService.get_stylist_schedule_for_date(db, hairdresser_id, target_date)
        if not schedule or schedule.is_day_off:
            return []

        # Get all existing non-cancelled appointments for this stylist on this day
        start_of_day = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0)
        end_of_day = datetime(target_date.year, target_date.month, target_date.day, 23, 59, 59)

        query = db.query(Appointment).filter(
            Appointment.hairdresser_id == hairdresser_id,
            Appointment.status != AppointmentStatus.CANCELLED,
            Appointment.appointment_date >= start_of_day,
            Appointment.appointment_date <= end_of_day
        )
        if exclude_appointment_id:
            query = query.filter(Appointment.id != exclude_appointment_id)
        
        existing_appointments = query.all()

        available_slots: List[str] = []
        current_time = datetime.combine(target_date.date(), schedule.start_time)
        shift_end = datetime.combine(target_date.date(), schedule.end_time)

        step = timedelta(minutes=30)
        req_duration = timedelta(minutes=duration_minutes)

        while current_time + req_duration <= shift_end:
            slot_end = current_time + req_duration
            
            # Check overlap with any existing appointment
            is_overlap = False
            for app in existing_appointments:
                if max(current_time, app.appointment_date) < min(slot_end, app.end_time):
                    is_overlap = True
                    break
            
            if not is_overlap:
                available_slots.append(current_time.strftime("%H:%M"))
            
            current_time += step

        return available_slots

    @staticmethod
    def check_overlap(
        db: Session,
        hairdresser_id: int,
        start_time: datetime,
        service_ids: List[int],
        exclude_appointment_id: Optional[int] = None
    ) -> OverlapCheckResponse:
        """Check whether requested time slot is valid and free for the stylist."""
        hairdresser = db.query(Hairdresser).filter(
            Hairdresser.id == hairdresser_id,
            Hairdresser.is_active == True
        ).first()
        if not hairdresser:
            return OverlapCheckResponse(
                is_available=False,
                message="Thợ làm tóc không tồn tại hoặc đã ngừng hoạt động",
                start_time=start_time,
                end_time=start_time,
                duration_minutes=0,
                suggested_available_slots=[]
            )

        duration_minutes, _, _ = BookingService.calculate_booking_duration_and_price(db, service_ids)
        end_time = start_time + timedelta(minutes=duration_minutes)

        # 1. Check working hours & schedule
        schedule = BookingService.get_stylist_schedule_for_date(db, hairdresser_id, start_time)
        if not schedule or schedule.is_day_off:
            suggested = BookingService.generate_available_slots(db, hairdresser_id, start_time, duration_minutes, exclude_appointment_id)
            return OverlapCheckResponse(
                is_available=False,
                message=f"Thợ {hairdresser.full_name} không có ca làm việc hoặc nghỉ vào ngày này",
                start_time=start_time,
                end_time=end_time,
                duration_minutes=duration_minutes,
                suggested_available_slots=suggested
            )

        # Compare time within shift
        shift_start_dt = datetime.combine(start_time.date(), schedule.start_time)
        shift_end_dt = datetime.combine(start_time.date(), schedule.end_time)

        if start_time < shift_start_dt or end_time > shift_end_dt:
            suggested = BookingService.generate_available_slots(db, hairdresser_id, start_time, duration_minutes, exclude_appointment_id)
            return OverlapCheckResponse(
                is_available=False,
                message=f"Khung giờ yêu cầu ({start_time.strftime('%H:%M')} - {end_time.strftime('%H:%M')}) nằm ngoài ca làm việc ({schedule.start_time.strftime('%H:%M')} - {schedule.end_time.strftime('%H:%M')})",
                start_time=start_time,
                end_time=end_time,
                duration_minutes=duration_minutes,
                suggested_available_slots=suggested
            )

        # 2. Check overlap with existing appointments
        query = db.query(Appointment).filter(
            Appointment.hairdresser_id == hairdresser_id,
            Appointment.status != AppointmentStatus.CANCELLED,
            Appointment.appointment_date < end_time,
            Appointment.end_time > start_time
        )
        if exclude_appointment_id:
            query = query.filter(Appointment.id != exclude_appointment_id)

        conflicting_app = query.first()
        if conflicting_app:
            suggested = BookingService.generate_available_slots(db, hairdresser_id, start_time, duration_minutes, exclude_appointment_id)
            return OverlapCheckResponse(
                is_available=False,
                message=f"Khung giờ này đã có lịch hẹn khác trùng ({conflicting_app.appointment_date.strftime('%H:%M')} - {conflicting_app.end_time.strftime('%H:%M')})",
                start_time=start_time,
                end_time=end_time,
                duration_minutes=duration_minutes,
                conflicting_appointment_id=conflicting_app.id,
                suggested_available_slots=suggested
            )

        return OverlapCheckResponse(
            is_available=True,
            message="Khung giờ khả dụng",
            start_time=start_time,
            end_time=end_time,
            duration_minutes=duration_minutes,
            suggested_available_slots=[]
        )

    @staticmethod
    def create_public_booking(db: Session, booking_data: AppointmentCreatePublic) -> Appointment:
        """Create appointment directly from public booking client without requiring login."""
        # 1. Anti-overlap check
        check = BookingService.check_overlap(
            db=db,
            hairdresser_id=booking_data.hairdresser_id,
            start_time=booking_data.appointment_date,
            service_ids=booking_data.service_ids
        )
        if not check.is_available:
            slots_msg = f" Các khung giờ trống gợi ý: {', '.join(check.suggested_available_slots[:5])}" if check.suggested_available_slots else ""
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"{check.message}.{slots_msg}"
            )

        # 2. Find or create customer by phone
        customer = db.query(Customer).filter(Customer.phone == booking_data.customer_phone).first()
        if not customer:
            customer = Customer(
                full_name=booking_data.customer_name,
                phone=booking_data.customer_phone,
                email=booking_data.customer_email,
                gender=booking_data.customer_gender,
                notes="Đăng ký qua Public Booking"
            )
            db.add(customer)
            db.flush()
        else:
            # Update name/email if provided
            if booking_data.customer_name:
                customer.full_name = booking_data.customer_name
            if booking_data.customer_email:
                customer.email = booking_data.customer_email

        # 3. Calculate duration & services
        duration_minutes, total_price, services = BookingService.calculate_booking_duration_and_price(db, booking_data.service_ids)
        end_time = booking_data.appointment_date + timedelta(minutes=duration_minutes)

        # 4. Create appointment
        appointment = Appointment(
            customer_id=customer.id,
            hairdresser_id=booking_data.hairdresser_id,
            appointment_date=booking_data.appointment_date,
            end_time=end_time,
            status=AppointmentStatus.PENDING,
            total_price=total_price,
            notes=booking_data.notes
        )
        db.add(appointment)
        db.flush()

        # 5. Attach services
        for s in services:
            app_service = AppointmentService(
                appointment_id=appointment.id,
                service_id=s.id,
                price_at_booking=s.price
            )
            db.add(app_service)

        db.commit()
        db.refresh(appointment)

        AuditService.log(
            db=db,
            action="CREATE_PUBLIC_BOOKING",
            entity_name="Appointment",
            entity_id=appointment.id,
            details=f"Khách hàng {customer.full_name} ({customer.phone}) đặt lịch ngày {appointment.appointment_date.strftime('%Y-%m-%d %H:%M')}"
        )

        return appointment

    @staticmethod
    def create_admin_booking(db: Session, booking_data: AppointmentCreateAdmin, user_id: Optional[int] = None) -> Appointment:
        """Create appointment created by receptionist/admin."""
        # 1. Anti-overlap check
        check = BookingService.check_overlap(
            db=db,
            hairdresser_id=booking_data.hairdresser_id,
            start_time=booking_data.appointment_date,
            service_ids=booking_data.service_ids
        )
        if not check.is_available:
            slots_msg = f" Các khung giờ trống gợi ý: {', '.join(check.suggested_available_slots[:5])}" if check.suggested_available_slots else ""
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"{check.message}.{slots_msg}"
            )

        customer = db.query(Customer).filter(Customer.id == booking_data.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")

        duration_minutes, total_price, services = BookingService.calculate_booking_duration_and_price(db, booking_data.service_ids)
        end_time = booking_data.appointment_date + timedelta(minutes=duration_minutes)

        appointment = Appointment(
            customer_id=customer.id,
            hairdresser_id=booking_data.hairdresser_id,
            appointment_date=booking_data.appointment_date,
            end_time=end_time,
            status=AppointmentStatus.CONFIRMED,
            total_price=total_price,
            notes=booking_data.notes
        )
        db.add(appointment)
        db.flush()

        for s in services:
            app_service = AppointmentService(
                appointment_id=appointment.id,
                service_id=s.id,
                price_at_booking=s.price
            )
            db.add(app_service)

        db.commit()
        db.refresh(appointment)

        AuditService.log(
            db=db,
            action="CREATE_ADMIN_BOOKING",
            entity_name="Appointment",
            entity_id=appointment.id,
            user_id=user_id,
            details=f"Nhân viên tạo lịch hẹn #{appointment.id} cho {customer.full_name}"
        )

        return appointment

    @staticmethod
    def reschedule_appointment(
        db: Session,
        appointment_id: int,
        reschedule_data: AppointmentReschedule,
        user_id: Optional[int] = None
    ) -> Appointment:
        """Reschedule date/time or stylist for an appointment with full anti-overlap validation."""
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            raise HTTPException(status_code=404, detail="Lịch hẹn không tồn tại")

        if appointment.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể đổi lịch hẹn có trạng thái {appointment.status.value}"
            )

        target_hairdresser_id = reschedule_data.hairdresser_id or appointment.hairdresser_id
        service_ids = [s.service_id for s in appointment.appointment_services]

        # Check overlap
        check = BookingService.check_overlap(
            db=db,
            hairdresser_id=target_hairdresser_id,
            start_time=reschedule_data.appointment_date,
            service_ids=service_ids,
            exclude_appointment_id=appointment.id
        )
        if not check.is_available:
            slots_msg = f" Các khung giờ trống gợi ý: {', '.join(check.suggested_available_slots[:5])}" if check.suggested_available_slots else ""
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"{check.message}.{slots_msg}"
            )

        duration_minutes = check.duration_minutes
        appointment.hairdresser_id = target_hairdresser_id
        appointment.appointment_date = reschedule_data.appointment_date
        appointment.end_time = reschedule_data.appointment_date + timedelta(minutes=duration_minutes)
        if reschedule_data.notes:
            appointment.notes = reschedule_data.notes

        db.commit()
        db.refresh(appointment)

        AuditService.log(
            db=db,
            action="RESCHEDULE_APPOINTMENT",
            entity_name="Appointment",
            entity_id=appointment.id,
            user_id=user_id,
            details=f"Đổi lịch hẹn #{appointment.id} sang {appointment.appointment_date.strftime('%Y-%m-%d %H:%M')}"
        )

        return appointment

    @staticmethod
    def cancel_appointment(db: Session, appointment_id: int, user_id: Optional[int] = None) -> Appointment:
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            raise HTTPException(status_code=404, detail="Lịch hẹn không tồn tại")

        if appointment.status == AppointmentStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Không thể hủy lịch hẹn đã hoàn thành")

        appointment.status = AppointmentStatus.CANCELLED
        db.commit()
        db.refresh(appointment)

        AuditService.log(
            db=db,
            action="CANCEL_APPOINTMENT",
            entity_name="Appointment",
            entity_id=appointment.id,
            user_id=user_id,
            details=f"Hủy lịch hẹn #{appointment.id}"
        )

        return appointment
