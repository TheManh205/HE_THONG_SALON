from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.hairdresser import HairdresserResponse

class ServiceHistoryResponse(BaseModel):
    id: int
    customer_id: int
    hairdresser_id: int
    appointment_id: Optional[int] = None
    service_names: str
    formula_or_color_code: Optional[str] = None
    notes: Optional[str] = None
    cost: float
    completed_at: datetime
    hairdresser: Optional[HairdresserResponse] = None
    model_config = ConfigDict(from_attributes=True)
