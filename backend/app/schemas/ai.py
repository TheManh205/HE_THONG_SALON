from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class RecommendedServiceItem(BaseModel):
    service_id: int
    service_name: str
    price: float
    duration_minutes: int
    reason: str

class AIRecommendationRequest(BaseModel):
    model_config = ConfigDict(extra="allow")
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    gender: Optional[str] = "Female"
    hair_condition: Optional[str] = "Tóc khô xơ, đã từng tẩy uốn"
    desired_style: Optional[str] = "Muốn nhuộm màu tone lạnh nhẹ nhàng, phục hồi tóc bóng mượt"
    budget_max: Optional[float] = None

class AIRecommendationResponse(BaseModel):
    styling_advice: str
    recommended_services: List[RecommendedServiceItem]
    total_estimated_price: float
    total_duration_minutes: int
    home_care_tips: List[str]

class AICareMessageRequest(BaseModel):
    model_config = ConfigDict(extra="allow")
    customer_id: Optional[int] = None
    customer_name: str
    message_type: str # "REMINDER" (Nhắc lịch hẹn), "AFTERCARE" (Chăm sóc sau làm tóc), "RE_ENGAGE" (Ưu đãi quay lại)
    appointment_id: Optional[int] = None
    service_names: Optional[str] = "Uốn tóc sóng lơi & Nhuộm phục hồi"
    appointment_time: Optional[str] = None

class AICareMessageResponse(BaseModel):
    message_type: str
    channel: str # "Zalo/SMS", "Email"
    title: str
    message_content: str

class AISummaryRequest(BaseModel):
    customer_id: int

class AISummaryResponse(BaseModel):
    customer_id: int
    customer_name: str
    summary: str
    preferred_styles_or_colors: List[str]
    frequent_stylist: Optional[str] = None
    technical_notes: List[str]
    last_visit_date: Optional[str] = None

class ChatMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str

class AIChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    customer_name: Optional[str] = None
    gender: Optional[str] = "Nữ"
    api_key: Optional[str] = None

class AIChatResponse(BaseModel):
    reply: str
    suggested_services: List[RecommendedServiceItem] = []
    quick_replies: List[str] = []
