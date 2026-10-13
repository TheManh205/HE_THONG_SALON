from datetime import datetime
import enum
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Enum, Time
from sqlalchemy.orm import relationship, synonym
from app.core.database import Base

class AppointmentStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    stylist_id = Column(Integer, ForeignKey("hairdressers.id"), nullable=False, index=True)
    booking_code = Column(String(20), unique=True, index=True, nullable=True)
    appointment_date = Column(DateTime, nullable=False, index=True) # Start datetime
    start_time = Column(Time, nullable=True)
    end_time = Column(DateTime, nullable=False, index=True) # Calculated end datetime
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.PENDING, nullable=False, index=True)
    estimated_total = Column(Float, default=0.0)
    customer_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Aliases for compatibility
    hairdresser_id = synonym("stylist_id")
    total_price = synonym("estimated_total")
    notes = synonym("customer_note")

    customer = relationship("Customer", back_populates="appointments")
    hairdresser = relationship("Hairdresser", back_populates="appointments")
    appointment_services = relationship("AppointmentService", back_populates="appointment", cascade="all, delete-orphan")
    invoice = relationship("Invoice", back_populates="appointment", cascade="all, delete-orphan", uselist=False)
    service_history = relationship("ServiceHistory", back_populates="appointment", cascade="all, delete-orphan", uselist=False)
