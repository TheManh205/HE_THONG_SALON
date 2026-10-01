from app.models.user import RoleEnum
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.ai import (
    AIRecommendationRequest,
    AIRecommendationResponse,
    AICareMessageRequest,
    AICareMessageResponse,
    AISummaryRequest,
    AISummaryResponse
)
from app.services.ai_service import AIService
from app.services.auth_service import require_roles, get_current_user, get_optional_current_user

router = APIRouter(prefix="/ai", tags=["AI Engine (Gemini Powered)"])

@router.post("/recommend", response_model=AIRecommendationResponse)
def get_ai_recommendation(
    request: AIRecommendationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_current_user)
):
    """
    AI Smart Hair Advisor:
    - Recommends services strictly adhering to DB catalog (Prompt Guard).
    - Returns styling advice, combo of DB services, and home care tips.
    - Publicly accessible to enhance customer booking experience.
    """
    if request.customer_id and not current_user:
        # Public users cannot query customer history
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không được phép truy cập lịch sử khách hàng nếu chưa đăng nhập."
        )
    return AIService.get_recommendations(db, request, current_user)

@router.post("/generate-care-message", response_model=AICareMessageResponse)
def generate_care_message(
    request: AICareMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST]))
):
    """
    Generate personalized salon messages (Appointment reminders, post-care guides, re-engagement).
    """
    return AIService.generate_care_message(db, request, current_user)

@router.post("/summarize-history", response_model=AISummaryResponse)
def summarize_customer_history(
    request: AISummaryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST, RoleEnum.HAIRDRESSER]))
):
    """
    Summarize a customer's hair treatment history and formulas for quick stylist glance.
    """
    return AIService.summarize_customer_history(db, request, current_user)
