from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class ServiceHistory(Base):
    __tablename__ = "service_histories"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    hairdresser_id = Column(Integer, ForeignKey("hairdressers.id"), nullable=False, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), unique=True, nullable=True)
    service_names = Column(String(255), nullable=False) # e.g. "Cắt tóc nam Fade, Uốn phồng chân tóc"
    formula_or_color_code = Column(String(255), nullable=True) # e.g. "Thuốc nhuộm Loreal 6.1 + Oxy 6% (30p)"
    notes = Column(Text, nullable=True) # e.g. "Khách da đầu nhạy cảm, thích sấy tự nhiên"
    cost = Column(Float, nullable=False, default=0.0)
    completed_at = Column(DateTime, default=datetime.utcnow, index=True)

    customer = relationship("Customer", back_populates="service_histories")
    hairdresser = relationship("Hairdresser", back_populates="service_histories")
    appointment = relationship("Appointment", back_populates="service_history")
