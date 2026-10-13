import json
import re
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.service import Service
from app.models.customer import Customer
from app.models.history import ServiceHistory
from app.models.user import User
from app.schemas.ai import (
    AIRecommendationRequest,
    AIRecommendationResponse,
    RecommendedServiceItem,
    AICareMessageRequest,
    AICareMessageResponse,
    AISummaryRequest,
    AISummaryResponse,
    AIChatRequest,
    AIChatResponse
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
    def _get_gemini_client(custom_api_key: Optional[str] = None):
        key = (custom_api_key or "").strip() or (settings.GEMINI_API_KEY or "").strip()
        if not key or not GENAI_SDK_AVAILABLE:
            return None
        try:
            client = genai.Client(api_key=key)
            return client
        except Exception as e:
            print(f"[AIService] Failed to initialize Gemini Client: {e}", flush=True)
            return None

    @staticmethod
    def _generate_content_with_fallback(
        client,
        contents: str,
        system_instruction: str,
        temperature: float = 0.2,
        response_mime_type: str = "application/json"
    ) -> Optional[str]:
        if not client:
            return None
        candidate_models = [
            settings.GEMINI_MODEL,
            "gemini-flash-lite-latest",
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite",
            "gemini-flash-latest"
        ]
        unique_models = []
        for m in candidate_models:
            if m and m not in unique_models:
                unique_models.append(m)

        for model_name in unique_models:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=temperature,
                        response_mime_type=response_mime_type
                    )
                )
                if response and response.text:
                    print(f"[AIService] Generated response successfully using model '{model_name}'", flush=True)
                    return response.text
            except Exception as e:
                print(f"[AIService] Model '{model_name}' failed: {e}", flush=True)
                continue
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
    def get_recommendations(
        db: Session,
        request: AIRecommendationRequest,
        current_user: Optional[User] = None
    ) -> AIRecommendationResponse:
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
        raw_json_str = AIService._generate_content_with_fallback(
            client=client,
            contents=user_prompt,
            system_instruction=system_instruction,
            temperature=settings.AI_TEMPERATURE,
            response_mime_type="application/json"
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
    def generate_care_message(
        request_or_db: Any,
        request: Optional[AICareMessageRequest] = None,
        current_user: Optional[User] = None
    ) -> AICareMessageResponse:
        """Generate personalized salon messages: Appointment reminders, Post-care instructions, Re-engagement offers."""
        req: AICareMessageRequest = request if isinstance(request, AICareMessageRequest) else request_or_db
        system_instruction = (
            "Bạn là Trợ lý Chăm sóc Khách hàng Tận tâm của Salon Tóc Cao Cấp (Salon Customer Care AI).\n"
            "Nhiệm vụ: Viết tin nhắn Zalo/SMS hoặc Email cá nhân hóa, ấm áp, lịch sự, chuyên nghiệp và đầy đủ thông tin hữu ích."
        )

        user_prompt = f"""
THÔNG TIN YÊU CẦU:
- Tên khách hàng: {req.customer_name}
- Loại tin nhắn: {req.message_type} (REMINDER: Nhắc lịch hẹn sắp tới, AFTERCARE: Hướng dẫn chăm sóc tại nhà sau làm tóc, RE_ENGAGE: Mời khách quay lại kèm ưu đãi)
- Dịch vụ đã làm / sắp làm: {req.service_names or 'Chăm sóc tóc chuyên sâu'}
- Thời gian lịch hẹn (nếu có): {req.appointment_time or 'Hôm nay'}

Hãy tạo tin nhắn chuẩn mực, có emoji tinh tế, lịch sự, thân thiện.
Trả về JSON duy nhất:
{{
  "message_type": "{req.message_type}",
  "channel": "Zalo/SMS",
  "title": "Tiêu đề ngắn gọn",
  "message_content": "Nội dung tin nhắn đầy đủ"
}}
"""

        client = AIService._get_gemini_client()
        raw_json_str = AIService._generate_content_with_fallback(
            client=client,
            contents=user_prompt,
            system_instruction=system_instruction,
            temperature=0.3,
            response_mime_type="application/json"
        )

        if not raw_json_str:
            # Fallback smart generator
            if req.message_type == "REMINDER":
                title = "Nhắc lịch hẹn làm tóc tại Salon"
                content = f"✨ Xin chào {req.customer_name}! Salon xin nhắc bạn có lịch hẹn lúc {req.appointment_time or 'ngày mai'} cho dịch vụ {req.service_names}. Đội ngũ stylist đã chuẩn bị sẵn sàng để đón tiếp bạn. Nếu cần điều chỉnh thời gian, bạn vui lòng liên hệ lại hotline salon nhé! Chúc bạn một ngày tràn đầy năng lượng 💖"
            elif req.message_type == "AFTERCARE":
                title = "Cẩm nang chăm sóc tóc sau làm dịch vụ"
                content = f"🌿 Cảm ơn {req.customer_name} đã tin tưởng trải nghiệm dịch vụ '{req.service_names}' tại Salon hôm nay! Để giữ mái tóc luôn bóng mượt & bền màu:\n1. Tránh gội đầu trong 48h tới.\n2. Sử dụng nước mát và dầu dưỡng tóc khi sấy.\nNếu tóc cần hỗ trợ chỉnh sửa, salon bảo hành miễn phí trong 7 ngày nhé! Chúc bạn luôn rạng rỡ ✨"
            else: # RE_ENGAGE
                title = "Ưu đãi tri ân khách hàng thân thiết"
                content = f"🎁 Chào {req.customer_name}! Đã một thời gian kể từ lần gần nhất bạn ghé salon làm dịch vụ {req.service_names}. Mái tóc của bạn có lẽ đã cần được phục hồi và cắt tỉa lại form dáng. Salon gửi tặng bạn voucher ưu đãi 15% cho lần ghé thăm tiếp theo. Đặt lịch ngay hôm nay để nhận ưu đãi nhé! ✨"

            return AICareMessageResponse(
                message_type=req.message_type,
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
                message_type=req.message_type,
                channel="Zalo/SMS",
                title="Thông báo từ Salon Tóc",
                message_content=f"Kính gửi {req.customer_name}, Salon xin gửi lời cảm ơn và lời chúc tốt đẹp nhất đến bạn!"
            )

    @staticmethod
    def summarize_customer_history(
        db: Session,
        request: AISummaryRequest,
        current_user: Optional[User] = None
    ) -> AISummaryResponse:
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

        histories = db.query(ServiceHistory).filter(
            ServiceHistory.customer_id == customer.id
        ).order_by(ServiceHistory.completed_at.desc()).all()

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
        raw_json_str = AIService._generate_content_with_fallback(
            client=client,
            contents=user_prompt,
            system_instruction="Bạn là Trợ lý Kỹ thuật Salon Tóc giúp tóm tắt nhanh lịch sử khách cho thợ làm tóc.",
            temperature=0.2,
            response_mime_type="application/json"
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

    @staticmethod
    def chat_consultation(db: Session, request: AIChatRequest) -> AIChatResponse:
        """
        AI Stylist Chatbot Consultation:
        - Consults customers on hairstyles, coloring, perm techniques, and treatments.
        - Grounded in active services from DB catalog with strict anti-hallucination.
        - Returns conversational stylist reply, matched recommended services, and quick prompts.
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
        services_map = {s.id: s for s in active_services}

        system_instruction = (
            "Bạn là Chuyên gia Tư vấn Tạo mẫu Tóc AI Cao Cấp của THE MANH Salon (Master Stylist AI Advisor).\n"
            "PHONG CÁCH TƯ VẤN: Lịch sự, chu đáo, tinh tế, dí dỏm tự nhiên, am hiểu sâu về phong cách và kỹ thuật tạo mẫu tóc.\n"
            "QUY TẮC BẢO VỆ CHỐNG HALLUCINATION VÀ TƯ VẤN ĐÚNG TRỌNG TÂM:\n"
            "1. Nếu khách hàng hỏi câu hỏi đời thường, chuyện phiếm, chào hỏi hoặc hỏi vui (ví dụ: ăn cơm, ăn uống, thời tiết, giải trí...), hãy trả lời một cách tự nhiên, thân thiện và dí dỏm bằng tiếng Việt đúng trọng tâm câu hỏi của khách. Tuyệt đối KHÔNG trả lời lạc đề sang uốn tóc hay phục hồi tóc nếu khách không hề hỏi. Sau đó có thể khéo léo mời khách tham khảo dịch vụ làm tóc nếu có nhu cầu.\n"
            "2. CHỈ gợi ý các dịch vụ có trong 'DANH MỤC DỊCH VỤ SALON' bên dưới nếu thực sự liên quan đến câu hỏi. Nếu câu hỏi ngoài lề hoặc chưa có nhu cầu cụ thể, hãy để suggested_services là [].\n"
            "3. Tuyệt đối KHÔNG tự sáng tác dịch vụ hoặc giá tiền ngoài danh mục.\n"
            "4. Trả về DUY NHẤT một JSON hợp lệ theo cấu trúc:\n"
            "{\n"
            '  "reply": "Câu trả lời tư vấn chi tiết, thân thiện, trả lời đúng câu hỏi của khách...",\n'
            '  "suggested_services": [\n'
            '    {\n'
            '      "service_id": 1,\n'
            '      "reason": "Lý do ngắn gọn phù hợp với nhu cầu"\n'
            '    }\n'
            '  ],\n'
            '  "quick_replies": ["Gợi ý câu hỏi tiếp theo 1", "Gợi ý câu hỏi tiếp theo 2"]\n'
            "}"
        )

        history_lines = []
        for msg in (request.history or [])[-6:]:
            prefix = "Khách hàng" if msg.role == "user" else "Stylist AI"
            history_lines.append(f"{prefix}: {msg.content}")

        history_str = "\n".join(history_lines) if history_lines else "Chưa có lịch sử trước đó."

        user_prompt = f"""
DANH MỤC DỊCH VỤ SALON HIỆN CÓ:
{json.dumps(services_catalog, ensure_ascii=False, indent=2)}

LỊCH SỬ HỘI THOẠI GẦN ĐÂY:
{history_str}

CÂU HỎI MỚI CỦA KHÁCH HÀNG:
Khách hàng ({request.gender or 'Khách'}): {request.message}

Hãy phản hồi bằng tiếng Việt chu đáo, thẩm mỹ cao và gợi ý dịch vụ phù hợp nhất từ danh mục (nếu có).
Trả về JSON duy nhất.
"""

        client = AIService._get_gemini_client(request.api_key)
        raw_json_str = AIService._generate_content_with_fallback(
            client=client,
            contents=user_prompt,
            system_instruction=system_instruction,
            temperature=0.3,
            response_mime_type="application/json"
        )

        if raw_json_str:
            try:
                cleaned = AIService._clean_json_output(raw_json_str)
                data = json.loads(cleaned)
                reply = data.get("reply", "")
                suggested_raw = data.get("suggested_services", [])
                quick_replies = data.get("quick_replies", [])

                matched_items = []
                for item in suggested_raw:
                    sid = item.get("service_id")
                    if sid in services_map:
                        svc = services_map[sid]
                        matched_items.append(RecommendedServiceItem(
                            service_id=svc.id,
                            service_name=svc.name,
                            price=svc.price,
                            duration_minutes=svc.duration_minutes,
                            reason=item.get("reason", "Phù hợp với nhu cầu của bạn.")
                        ))

                if reply:
                    return AIChatResponse(
                        reply=reply,
                        suggested_services=matched_items,
                        quick_replies=quick_replies or ["Đặt lịch ngay", "Tư vấn thêm về màu nhuộm", "Chi phí làm trọn gói?"]
                    )
            except Exception as e:
                print(f"[AIService] JSON parse error from Gemini response: {e}", flush=True)

        # Intelligent Fallback Advisor (only used if Gemini API is unreachable)
        msg_lower = request.message.lower()
        matched_svcs = []
        reply_lines = []
        quick_replies = ["Đặt lịch tư vấn trực tiếp", "Xem chi tiết bảng giá", "Cách chăm sóc sau làm tóc"]

        has_dye = bool(re.search(r'(?:\b|\s)(nhuộm|tẩy tóc|màu tóc|balayage|nâu tây|bạch kim|highlight)(?:\b|\s)', msg_lower))
        has_perm = bool(re.search(r'(?:\b|\s)(uốn tóc|uốn xoăn|uốn lơi|uốn sóng|uốn phồng|làm xoăn|uốn setting)(?:\b|\s)', msg_lower))
        has_repair = bool(re.search(r'(?:\b|\s)(phục hồi|hư tổn|chẻ ngọn|tóc khô|tóc xơ|hàn gắn|olaplex|keratin)(?:\b|\s)', msg_lower))
        has_cut = bool(re.search(r'(?:\b|\s)(cắt tóc|tỉa tóc|cắt layer|tỉa layer|undercut|fade|tạo kiểu tóc)(?:\b|\s)', msg_lower))

        if has_dye:
            found = [s for s in active_services if "nhuộm" in s.name.lower() or "màu" in s.name.lower()]
            if found:
                matched_svcs.append(found[0])
            reply_lines.append("Với màu nhuộm, salon luôn ưu tiên các dòng thuốc cao cấp (L'Oréal, Wella) bổ sung dưỡng chất để màu lên chuẩn sắc, bóng mượt và tôn sáng tone da của bạn.")

        if has_perm:
            found = [s for s in active_services if "uốn" in s.name.lower()]
            if found:
                matched_svcs.append(found[0])
            reply_lines.append("Đối với kỹ thuật uốn, salon ứng dụng công nghệ uốn setting nhiệt độ thấp kết hợp trục uốn tạo sóng lơi tự nhiên, mềm mại và rất dễ sấy tạo kiểu tại nhà.")

        if has_repair:
            found = [s for s in active_services if "phục hồi" in s.name.lower() or "olaplex" in s.name.lower()]
            if found:
                matched_svcs.append(found[0])
            reply_lines.append("Tóc khô xơ hư tổn cần được hàn gắn các liên kết lưu huỳnh bên trong sợi tóc trước khi tạo kiểu. Gói phục hồi Olaplex & Keratin chuyên sâu sẽ giúp tóc lấy lại độ đanh dai và bóng mượt vượt trội.")

        if has_cut:
            found = [s for s in active_services if "cắt" in s.name.lower()]
            if found:
                matched_svcs.append(found[0])
            reply_lines.append("Về form tóc, dáng cắt layer tỉa tơ mềm mại hoặc form chuẩn salon sẽ giúp cân đối tỷ lệ khuôn mặt, tạo độ bay tự nhiên và giúp bạn trẻ trung, thanh thoát hơn.")

        if not reply_lines:
            reply_lines.append("Chào bạn! THE MANH Salon luôn sẵn lòng tư vấn cho bạn từ kiểu cắt phù hợp dáng mặt, màu nhuộm tôn da đến các liệu trình phục hồi chuyên sâu. Bạn hãy chia sẻ thêm về tình trạng tóc hiện tại hoặc phong cách bạn muốn hướng tới nhé!")

        final_reply = " ".join(reply_lines)
        service_items = [
            RecommendedServiceItem(
                service_id=s.id,
                service_name=s.name,
                price=s.price,
                duration_minutes=s.duration_minutes,
                reason="Dịch vụ được stylist đề xuất phù hợp tối ưu theo nhu cầu của bạn."
            )
            for s in matched_svcs[:2]
        ]

        return AIChatResponse(
            reply=final_reply,
            suggested_services=service_items,
            quick_replies=quick_replies
        )
