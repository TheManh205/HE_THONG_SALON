from datetime import datetime, time
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class ScheduleBase(BaseModel):
    day_of_week: int # 0=Mon, 6=Sun
    start_time: time
    end_time: time
    is_day_off: bool = False

class ScheduleCreate(ScheduleBase):
    hairdresser_id: Optional[int] = None

class ScheduleResponse(ScheduleBase):
    id: int
    hairdresser_id: int
    model_config = ConfigDict(from_attributes=True)

class HairdresserBase(BaseModel):
    full_name: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    rating: Optional[float] = 5.0
    is_active: Optional[bool] = True

class HairdresserCreate(HairdresserBase):
    user_id: Optional[int] = None
    schedules: Optional[List[ScheduleBase]] = None

class HairdresserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    rating: Optional[float] = None
    is_active: Optional[bool] = None

class HairdresserResponse(HairdresserBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    schedules: List[ScheduleResponse] = []
    model_config = ConfigDict(from_attributes=True)
