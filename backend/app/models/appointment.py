from datetime import datetime
import enum
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
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
    hairdresser_id = Column(Integer, ForeignKey("hairdressers.id"), nullable=False, index=True)
    appointment_date = Column(DateTime, nullable=False, index=True) # Start datetime
    end_time = Column(DateTime, nullable=False, index=True) # Calculated end datetime
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.PENDING, nullable=False, index=True)
    total_price = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="appointments")
    hairdresser = relationship("Hairdresser", back_populates="appointments")
    appointment_services = relationship("AppointmentService", back_populates="appointment", cascade="all, delete-orphan")
    invoice = relationship("Invoice", back_populates="appointment", uselist=False)
    service_history = relationship("ServiceHistory", back_populates="appointment", uselist=False)
