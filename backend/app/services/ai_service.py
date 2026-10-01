import json
import re
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.service import Service
from app.models.customer import Customer
from app.models.history import ServiceHistory
from app.schemas.ai import (
    AIRecommendationRequest,
    AIRecommendationResponse,
    RecommendedServiceItem,
    AICareMessageRequest,
    AICareMessageResponse,
    AISummaryRequest,
    AISummaryResponse
)

# Attempt to import google-genai
try:
    from google import genai
    from google.genai import types
    GENAI_SDK_AVAILABLE = True
except ImportError:
    GENAI_SDK_AVAILABLE = False


class AIService:
    @staticmethod
    def _get_gemini_client():
        if not settings.GEMINI_API_KEY or not GENAI_SDK_AVAILABLE:
            return None
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            return client
        except Exception:
            return None

    @staticmethod
    def _clean_json_output(text: str) -> str:
        """Strip markdown code fences and clean up json string."""
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()

    @staticmethod
    def _generate_with_retry(client, model, contents, config, max_retries=2) -> Optional[str]:
        import time
        for attempt in range(max_retries + 1):
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=contents,
                    config=config
                )
                return response.text
            except Exception as e:
                print(f"[AI Retry] Lỗi Gemini API (Attempt {attempt+1}/{max_retries+1}): {e}")
                if attempt < max_retries:
                    time.sleep(1) # Delay before retry
                else:
                    return None

    @staticmethod
    def get_recommendations(db: Session, request: AIRecommendationRequest) -> AIRecommendationResponse:
        """
        AI Hair Advisor with Strict Prompt Guard & Anti-Hallucination:
        - Feeds active services catalog from DB.
        - Restricts AI to temperature=0.2.
        - System instruction strictly forbids inventing non-existent services.
        - Validates JSON output against DB services.
        """
        active_services = db.query(Service).filter(Service.is_active == True).all()
        services_catalog = [
            {
                "id": s.id,
                "name": s.name,
                "category": s.category,
                "price": s.price,
                "duration_minutes": s.duration_minutes,
                "description": s.description or ""
            }
            for s in active_services
        ]
        services_catalog_map = {s.id: s for s in active_services}

        # Fetch customer history if customer_id provided
        history_context = ""
        if request.customer_id:
            histories = db.query(ServiceHistory).filter(
                ServiceHistory.customer_id == request.customer_id
            ).order_by(ServiceHistory.completed_at.desc()).limit(3).all()
            if histories:
                history_items = [f"- Ngày {h.completed_at.strftime('%Y-%m-%d')}: {h.service_names} (Công thức/Ghi chú: {h.formula_or_color_code or h.notes or 'Không'})" for h in histories]
                history_context = f"\nLịch sử làm tóc gần đây của khách:\n" + "\n".join(history_items)

        # Build prompt
        system_instruction = (
            "Bạn là Chuyên gia Tư vấn Tạo mẫu Tóc Salon AI Cao Cấp (Hair Stylist AI Advisor).\n"
            "QUY TẮC BẢO VỆ CHỐNG HALLUCINATION BẮT BUỘC:\n"
            "1. Bạn CHỈ ĐƯỢC PHÉP gợi ý các dịch vụ có trong danh sách 'DANH MỤC DỊCH VỤ SALON' bên dưới.\n"
            "2. Tuyệt đối KHÔNG tự sáng tác, bịa đặt hoặc thêm bất kỳ dịch vụ hay mức giá nào ngoài danh mục.\n"
            "3. Bắt buộc giữ đúng 'service_id' từ danh mục.\n"
            "4. Phản hồi CHỈ BẰNG MỘT JSON HỢP LỆ theo cấu trúc được yêu cầu, không kèm markdown hay văn bản ngoài JSON."
        )

        user_prompt = f"""
DANH MỤC DỊCH VỤ SALON HIỆN CÓ:
{json.dumps(services_catalog, ensure_ascii=False, indent=2)}

THÔNG TIN KHÁCH HÀNG:
- Tên khách hàng: {request.customer_name or 'Quý khách'}
- Giới tính: {request.gender or 'Nữ'}
- Tình trạng tóc hiện tại: {request.hair_condition or 'Tóc thường'}
- Nhu cầu / Phong cách mong muốn: {request.desired_style or 'Tư vấn kiểu tóc phù hợp'}
- Ngân sách tối đa (nếu có): {f"{request.budget_max:,.0f} VND" if request.budget_max else 'Không giới hạn'}
{history_context}

Hãy phân tích kỹ lưỡng và đưa ra lời khuyên + combo dịch vụ tốt nhất từ danh mục trên.
Trả về định dạng JSON DUY NHẤT:
{{
  "styling_advice": "Lời khuyên chuyên môn chi tiết về kiểu tóc, màu sắc hoặc phương pháp phục hồi phù hợp với dáng mặt và chất tóc",
  "recommended_services": [
    {{
      "service_id": 1,
      "reason": "Lý do vì sao dịch vụ này cần thiết và phù hợp với khách"
    }}
  ],
  "home_care_tips": [
    "Mẹo 1 chăm sóc tóc tại nhà sau dịch vụ",
    "Mẹo 2",
    "Mẹo 3"
  ]
}}
"""

        client = AIService._get_gemini_client()
        raw_json_str = None

        if client:
            raw_json_str = AIService._generate_with_retry(
                client=client,
                model=settings.GEMINI_MODEL,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=settings.AI_TEMPERATURE,
                    response_mime_type="application/json"
                )
            )

        # Fallback intelligent rule-based engine if Gemini client unavailable or offline
        if not raw_json_str:
            raw_json_str = AIService._fallback_recommendation_logic(request, services_catalog)

        # Parse & Validate Output (Anti-Hallucination Filter)
        try:
            cleaned = AIService._clean_json_output(raw_json_str)
            data = json.loads(cleaned)
        except Exception:
            data = json.loads(AIService._fallback_recommendation_logic(request, services_catalog))

        valid_recommended_items: List[RecommendedServiceItem] = []
        total_price = 0.0
        total_duration = 0

        for item in data.get("recommended_services", []):
            sid = item.get("service_id")
            if sid in services_catalog_map:
                svc = services_catalog_map[sid]
                valid_recommended_items.append(
                    RecommendedServiceItem(
                        service_id=svc.id,
                        service_name=svc.name,
                        price=svc.price,
                        duration_minutes=svc.duration_minutes,
                        reason=item.get("reason", "Phù hợp với nhu cầu và cấu trúc tóc")
                    )
                )
                total_price += svc.price
                total_duration += svc.duration_minutes

        # In case no valid service matched, pick the best matching active service
        if not valid_recommended_items and active_services:
            svc = active_services[0]
            valid_recommended_items.append(
                RecommendedServiceItem(
                    service_id=svc.id,
                    service_name=svc.name,
                    price=svc.price,
                    duration_minutes=svc.duration_minutes,
                    reason="Dịch vụ cơ bản được đề xuất"
                )
            )
            total_price = svc.price
            total_duration = svc.duration_minutes

        return AIRecommendationResponse(
            styling_advice=data.get("styling_advice", "Kiểu tóc và dịch vụ được đề xuất để tôn lên nét đẹp tự nhiên và phục hồi sợi tóc chắc khỏe."),
            recommended_services=valid_recommended_items,
            total_estimated_price=total_price,
            total_duration_minutes=total_duration,
            home_care_tips=data.get("home_care_tips", [
                "Sử dụng dầu gội dịu nhẹ chuyên dụng không chứa sulfate.",
                "Ủ dưỡng tóc ít nhất 1 lần/tuần để duy trì độ ẩm và độ bóng.",
                "Sấy tóc ở chế độ gió mát hoặc ấm nhẹ để tránh làm tổn hại biểu bì tóc."
            ])
        )

    @staticmethod
    def _fallback_recommendation_logic(request: AIRecommendationRequest, services_catalog: List[Dict[str, Any]]) -> str:
        """Intelligent local expert fallback mimicking AI response strictly adhering to DB catalog."""
        condition = (request.hair_condition or "").lower()
        style = (request.desired_style or "").lower()

        chosen_ids = []
        # Find matching services from catalog
        for s in services_catalog:
            s_name = s["name"].lower()
            if ("phục hồi" in condition or "hư tổn" in condition or "khô" in condition) and ("phục hồi" in s_name or "collagen" in s_name or "keratin" in s_name):
                chosen_ids.append((s["id"], "Phục hồi cấu trúc biểu bì tóc, cung cấp dưỡng chất chuyên sâu."))
            elif ("nhuộm" in style or "màu" in style) and "nhuộm" in s_name:
                chosen_ids.append((s["id"], "Lên màu chuẩn sắc, tôn sáng tone da theo phong cách yêu cầu."))
            elif ("uốn" in style or "sóng" in style or "xoăn" in style) and "uốn" in s_name:
                chosen_ids.append((s["id"], "Tạo độ phồng tự nhiên và nếp uốn mềm mại chuẩn phong cách."))
            elif "cắt" in s_name and len(chosen_ids) < 2:
                chosen_ids.append((s["id"], "Cắt tạo form cân đối, tỉa layer nhẹ nhàng tôn dáng khuôn mặt."))

        if not chosen_ids and services_catalog:
            chosen_ids.append((services_catalog[0]["id"], "Dịch vụ tạo mẫu chuẩn salon."))

        # Keep top 2-3 services
        selected = [{"service_id": cid, "reason": r} for cid, r in chosen_ids[:3]]

        result = {
            "styling_advice": f"Dựa trên chất tóc ({request.hair_condition or 'bình thường'}) và mong muốn của bạn, salon đề xuất gói phối hợp phục hồi sợi tóc song song với kỹ thuật tạo kiểu hiện đại để giữ dáng tóc bền đẹp nhất.",
            "recommended_services": selected,
            "home_care_tips": [
                "Sau khi làm dịch vụ, nên tránh gội đầu trong vòng 48 giờ để màu/nếp định hình vững chắc.",
                "Dùng tinh dầu dưỡng tóc trước khi sấy và che chắn tóc khi tiếp xúc ánh nắng gắt.",
                "Hạn chế sử dụng máy kẹp nhiệt độ cao tại nhà."
            ]
        }
        return json.dumps(result, ensure_ascii=False)

    @staticmethod
    def generate_care_message(request: AICareMessageRequest) -> AICareMessageResponse:
        """Generate personalized salon messages: Appointment reminders, Post-care instructions, Re-engagement offers."""
        system_instruction = (
            "Bạn là Trợ lý Chăm sóc Khách hàng Tận tâm của Salon Tóc Cao Cấp (Salon Customer Care AI).\n"
            "Nhiệm vụ: Viết tin nhắn Zalo/SMS hoặc Email cá nhân hóa, ấm áp, lịch sự, chuyên nghiệp và đầy đủ thông tin hữu ích."
        )

        user_prompt = f"""
THÔNG TIN YÊU CẦU:
- Tên khách hàng: {request.customer_name}
- Loại tin nhắn: {request.message_type} (REMINDER: Nhắc lịch hẹn sắp tới, AFTERCARE: Hướng dẫn chăm sóc tại nhà sau làm tóc, RE_ENGAGE: Mời khách quay lại kèm ưu đãi)
- Dịch vụ đã làm / sắp làm: {request.service_names or 'Chăm sóc tóc chuyên sâu'}
- Thời gian lịch hẹn (nếu có): {request.appointment_time or 'Hôm nay'}

Hãy tạo tin nhắn chuẩn mực, có emoji tinh tế, lịch sự, thân thiện.
Trả về JSON duy nhất:
{{
  "message_type": "{request.message_type}",
  "channel": "Zalo/SMS",
  "title": "Tiêu đề ngắn gọn",
  "message_content": "Nội dung tin nhắn đầy đủ"
}}
"""

        client = AIService._get_gemini_client()
        raw_json_str = None

        if client:
            raw_json_str = AIService._generate_with_retry(
                client=client,
                model=settings.GEMINI_MODEL,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.3,
                    response_mime_type="application/json"
                )
            )

        if not raw_json_str:
            # Fallback smart generator
            if request.message_type == "REMINDER":
                title = "Nhắc lịch hẹn làm tóc tại Salon"
                content = f"✨ Xin chào {request.customer_name}! Salon xin nhắc bạn có lịch hẹn lúc {request.appointment_time or 'ngày mai'} cho dịch vụ {request.service_names}. Đội ngũ stylist đã chuẩn bị sẵn sàng để đón tiếp bạn. Nếu cần điều chỉnh thời gian, bạn vui lòng liên hệ lại hotline salon nhé! Chúc bạn một ngày tràn đầy năng lượng 💖"
            elif request.message_type == "AFTERCARE":
                title = "Cẩm nang chăm sóc tóc sau làm dịch vụ"
                content = f"🌿 Cảm ơn {request.customer_name} đã tin tưởng trải nghiệm dịch vụ '{request.service_names}' tại Salon hôm nay! Để giữ mái tóc luôn bóng mượt & bền màu:\n1. Tránh gội đầu trong 48h tới.\n2. Sử dụng nước mát và dầu dưỡng tóc khi sấy.\nNếu tóc cần hỗ trợ chỉnh sửa, salon bảo hành miễn phí trong 7 ngày nhé! Chúc bạn luôn rạng rỡ ✨"
            else: # RE_ENGAGE
                title = "Ưu đãi tri ân khách hàng thân thiết"
                content = f"🎁 Chào {request.customer_name}! Đã một thời gian kể từ lần gần nhất bạn ghé salon làm dịch vụ {request.service_names}. Mái tóc của bạn có lẽ đã cần được phục hồi và cắt tỉa lại form dáng. Salon gửi tặng bạn voucher ưu đãi 15% cho lần ghé thăm tiếp theo. Đặt lịch ngay hôm nay để nhận ưu đãi nhé! ✨"

            return AICareMessageResponse(
                message_type=request.message_type,
                channel="Zalo/SMS",
                title=title,
                message_content=content
            )

        try:
            cleaned = AIService._clean_json_output(raw_json_str)
            data = json.loads(cleaned)
            return AICareMessageResponse(**data)
        except Exception:
            return AICareMessageResponse(
                message_type=request.message_type,
                channel="Zalo/SMS",
                title="Thông báo từ Salon Tóc",
                message_content=f"Kính gửi {request.customer_name}, Salon xin gửi lời cảm ơn và lời chúc tốt đẹp nhất đến bạn!"
            )

    @staticmethod
    def summarize_customer_history(db: Session, request: AISummaryRequest, current_user=None) -> AISummaryResponse:
        """Summarize customer's hair treatment history, preferred stylist, and formulas for quick stylist glance."""
        customer = db.query(Customer).filter(Customer.id == request.customer_id).first()
        if not customer:
            return AISummaryResponse(
                customer_id=request.customer_id,
                customer_name="Khách hàng",
                summary="Không tìm thấy thông tin khách hàng",
                preferred_styles_or_colors=[],
                frequent_stylist=None,
                technical_notes=[]
            )

        query = db.query(ServiceHistory).filter(ServiceHistory.customer_id == customer.id)
        
        # Enforce Data-Level Scoping for Hairdresser
        from app.models.user import RoleEnum
        if current_user and getattr(current_user.role, 'name', '') == RoleEnum.HAIRDRESSER.value:
            if getattr(current_user, 'hairdresser', None):
                query = query.filter(ServiceHistory.hairdresser_id == current_user.hairdresser.id)
            else:
                query = query.filter(ServiceHistory.id == -1) # empty query if no profile

        histories = query.order_by(ServiceHistory.completed_at.desc()).all()

        if not histories:
            return AISummaryResponse(
                customer_id=customer.id,
                customer_name=customer.full_name,
                summary=f"Khách hàng mới chưa có lịch sử làm dịch vụ trước đó. Ghi chú cá nhân: {customer.notes or 'Không có'}.",
                preferred_styles_or_colors=[],
                frequent_stylist=None,
                technical_notes=[customer.notes] if customer.notes else []
            )

        # Prepare summary text
        history_records = []
        stylist_counts = {}
        for h in histories:
            stylist_name = h.hairdresser.full_name if h.hairdresser else "Thợ salon"
            stylist_counts[stylist_name] = stylist_counts.get(stylist_name, 0) + 1
            history_records.append({
                "date": h.completed_at.strftime("%Y-%m-%d"),
                "stylist": stylist_name,
                "services": h.service_names,
                "formula_or_notes": f"{h.formula_or_color_code or ''} - {h.notes or ''}".strip(" -")
            })

        most_frequent_stylist = max(stylist_counts, key=stylist_counts.get) if stylist_counts else None
        last_visit = histories[0].completed_at.strftime("%Y-%m-%d")

        user_prompt = f"""
Tóm tắt hồ sơ làm tóc của khách hàng:
- Tên: {customer.full_name}
- Giới tính: {customer.gender}
- Tổng số lần làm tóc: {len(histories)}
- Lần gần nhất: {last_visit}
- Thợ thường làm: {most_frequent_stylist}
- Chi tiết lịch sử:
{json.dumps(history_records, ensure_ascii=False, indent=2)}

Hãy tóm tắt ngắn gọn 2-3 câu để thợ làm tóc nắm bắt nhanh trước khi tiếp nhận khách.
Trả về JSON duy nhất:
{{
  "summary": "Đoạn tóm tắt tổng quan ngắn gọn",
  "preferred_styles_or_colors": ["Gu màu hoặc kiểu tóc khách thích"],
  "technical_notes": ["Ghi chú công thức hoặc lưu ý chất tóc"]
}}
"""

        client = AIService._get_gemini_client()
        raw_json_str = None

        if client:
            raw_json_str = AIService._generate_with_retry(
                client=client,
                model=settings.GEMINI_MODEL,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction="Bạn là Trợ lý Kỹ thuật Salon Tóc giúp tóm tắt nhanh lịch sử khách cho thợ làm tóc.",
                    temperature=0.2,
                    response_mime_type="application/json"
                )
            )

        if raw_json_str:
            try:
                cleaned = AIService._clean_json_output(raw_json_str)
                data = json.loads(cleaned)
                return AISummaryResponse(
                    customer_id=customer.id,
                    customer_name=customer.full_name,
                    summary=data.get("summary", ""),
                    preferred_styles_or_colors=data.get("preferred_styles_or_colors", []),
                    frequent_stylist=most_frequent_stylist,
                    technical_notes=data.get("technical_notes", []),
                    last_visit_date=last_visit
                )
            except Exception:
                pass

        # Smart fallback summary
        services_done = [h.service_names for h in histories]
        notes_list = [h.formula_or_color_code for h in histories if h.formula_or_color_code]
        if customer.notes:
            notes_list.append(customer.notes)

        return AISummaryResponse(
            customer_id=customer.id,
            customer_name=customer.full_name,
            summary=f"Khách hàng đã thực hiện {len(histories)} lần dịch vụ tại salon (gần nhất: {last_visit}). Thường xuyên sử dụng: {', '.join(set(services_done[:2]))}.",
            preferred_styles_or_colors=["Tone màu tự nhiên", "Uốn sóng nhẹ"],
            frequent_stylist=most_frequent_stylist,
            technical_notes=notes_list[:3],
            last_visit_date=last_visit
        )
