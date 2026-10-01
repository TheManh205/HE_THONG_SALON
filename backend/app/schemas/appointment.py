from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.appointment import AppointmentStatus
from app.schemas.customer import CustomerResponse
from app.schemas.hairdresser import HairdresserResponse
from app.schemas.service import ServiceResponse

class AppointmentServiceItem(BaseModel):
    service_id: int
    price_at_booking: Optional[float] = None

class AppointmentCreatePublic(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    customer_gender: Optional[str] = "Female"
    hairdresser_id: int
    appointment_date: datetime # e.g. "2026-08-28T09:30:00"
    service_ids: List[int]
    notes: Optional[str] = None

class AppointmentCreateAdmin(BaseModel):
    customer_id: int
    hairdresser_id: int
    appointment_date: datetime
    service_ids: List[int]
    notes: Optional[str] = None

class AppointmentUpdateStatus(BaseModel):
    status: AppointmentStatus

class AppointmentReschedule(BaseModel):
    hairdresser_id: Optional[int] = None
    appointment_date: datetime
    notes: Optional[str] = None

class OverlapCheckRequest(BaseModel):
    hairdresser_id: int
    appointment_date: datetime
    service_ids: List[int]
    exclude_appointment_id: Optional[int] = None

class OverlapCheckResponse(BaseModel):
    is_available: bool
    message: str
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    conflicting_appointment_id: Optional[int] = None
    suggested_available_slots: Optional[List[str]] = []

class AppointmentServiceResponse(BaseModel):
    id: int
    service_id: int
    price_at_booking: float
    service: Optional[ServiceResponse] = None
    model_config = ConfigDict(from_attributes=True)

class AppointmentResponse(BaseModel):
    id: int
    customer_id: int
    hairdresser_id: int
    booking_code: Optional[str] = None
    appointment_date: datetime
    end_time: datetime
    status: AppointmentStatus
    total_price: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    customer: Optional[CustomerResponse] = None
    hairdresser: Optional[HairdresserResponse] = None
    appointment_services: List[AppointmentServiceResponse] = []
    has_invoice: Optional[bool] = False
    model_config = ConfigDict(from_attributes=True)
