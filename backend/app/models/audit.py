from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False) # e.g. "CREATE_APPOINTMENT", "UPDATE_STATUS", "CREATE_INVOICE"
    entity_name = Column(String(50), nullable=False) # e.g. "Appointment", "Customer", "Invoice"
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True) # JSON or text details
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="audit_logs")
