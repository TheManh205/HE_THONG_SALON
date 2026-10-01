from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False, index=True)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(100), nullable=True, index=True)
    gender = Column(String(10), nullable=True) # Male, Female, Other
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    appointments = relationship("Appointment", back_populates="customer", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="customer", cascade="all, delete-orphan")
    service_histories = relationship("ServiceHistory", back_populates="customer", cascade="all, delete-orphan")
