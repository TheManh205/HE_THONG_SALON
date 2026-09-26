from datetime import datetime, time
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, Time, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from sqlalchemy import Date

class Hairdresser(Base):
    __tablename__ = "hairdressers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True)
    full_name = Column(String(100), nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(255), nullable=True)
    rating = Column(Float, default=5.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="hairdresser")
    schedules = relationship("Schedule", back_populates="hairdresser", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="hairdresser")
    service_histories = relationship("ServiceHistory", back_populates="hairdresser")

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    hairdresser_id = Column(Integer, ForeignKey("hairdressers.id"), nullable=False, index=True)
    day_of_week = Column(Integer, nullable=False) # 0: Monday, 1: Tuesday, ..., 6: Sunday
    start_time = Column(Time, default=time(8, 30))
    end_time = Column(Time, default=time(20, 0))
    is_day_off = Column(Boolean, default=False)

    hairdresser = relationship("Hairdresser", back_populates="schedules")


class DailySchedule(Base):
    __tablename__ = "daily_schedules"

    id = Column(Integer, primary_key=True, index=True)
    hairdresser_id = Column(Integer, ForeignKey("hairdressers.id"), nullable=False, index=True)
    schedule_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, default=time(8, 30))
    end_time = Column(Time, default=time(20, 0))
    is_day_off = Column(Boolean, default=False)

    hairdresser = relationship("Hairdresser", backref="daily_schedules")
