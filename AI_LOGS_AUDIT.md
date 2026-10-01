# AI_LOGS Audit

## 1. Current AI Architecture

Dựa trên mã nguồn hiện tại, kiến trúc AI (Gemini) được tích hợp trực tiếp, đồng bộ vào business logic:

- **Service Layer**: Toàn bộ logic AI nằm trong `backend/app/services/ai_service.py` (`AIService`).
- **API Layer**: API routes nằm tại `backend/app/routers/ai.py` tiếp nhận HTTP request và chuyển tiếp xuống `AIService`.
- **Dependency**: Không có message queue trung gian; việc gọi tới `google.genai.Client` là synchronous.
- **Fallback Mechanism**: Nếu gọi Gemini API thất bại hoặc trả về JSON không hợp lệ, hệ thống có logic dự phòng (rule-based local fallback) được kích hoạt ngay lập tức.

## 2. AI Request Flow

Quy trình gọi AI hiện tại:

1. **Client** -> gửi HTTP request.
2. **Router** (`backend/app/routers/ai.py`) nhận request, giải quyết dependencies (ví dụ: `get_db`, `get_current_user`, kiểm tra RBAC).
3. **Service** (`backend/app/services/ai_service.py`) thực hiện:
   - Truy vấn CSDL (`active_services`, `ServiceHistory`) để build context.
   - Xây dựng prompt chứa `system_instruction` và `user_prompt`.
   - Gọi `AIService._generate_with_retry(client, model, contents, config)`.
   - Trả về raw response từ Gemini.
4. **Validation/Catalog Guard**:
   - Hàm `_clean_json_output` xóa bỏ markdown.
   - Phân tích cú pháp JSON.
   - Đối chiếu danh sách `recommended_services` với danh mục trong CSDL thông qua `services_catalog_map`. (Nếu hallucination, loại bỏ).
5. **Response** -> Trả về client.

## 3. Existing AI Components

- **Vị trí gọi AI**: `backend/app/services/ai_service.py`
- **Các loại AI Request (3 loại)**:
  1. `get_recommendations` (AI Hair Advisor)
  2. `generate_care_message` (Tạo tin nhắn chăm sóc khách hàng)
  3. `summarize_customer_history` (Tóm tắt lịch sử làm tóc)
- **Inputs**:
  - `AIRecommendationRequest`: `customer_name`, `gender`, `hair_condition`, `desired_style`, `budget_max`, `customer_id`.
  - `AICareMessageRequest`: `customer_name`, `message_type`, `service_names`, `appointment_time`.
  - `AISummaryRequest`: `customer_id`.
- **Outputs**:
  - `AIRecommendationResponse`: `styling_advice`, `recommended_services` (danh sách chuẩn), `total_estimated_price`, `total_duration_minutes`, `home_care_tips`.
  - `AICareMessageResponse`: `message_type`, `channel`, `title`, `message_content`.
  - `AISummaryResponse`: Tóm tắt, notes, `frequent_stylist`, thông tin lịch sử.
- **Model**: Được lấy từ `settings.GEMINI_MODEL`.
- **Temperature/Config**: `temperature` sử dụng `settings.AI_TEMPERATURE` cho recommend, và hardcode `0.3` (message) / `0.2` (summary). Sử dụng `response_mime_type="application/json"`.
- **Timeout/Retry/Error Handling**: `_generate_with_retry` hỗ trợ tối đa `max_retries=2` với `time.sleep(1)`. Sau đó fallback logic nếu vẫn lỗi.
- **Catalog Guard**: `get_recommendations` loại bỏ mọi `service_id` sinh ra nếu không tồn tại trong `services_catalog_map`.

## 4. Existing Database Architecture

- **Pattern**: SQLAlchemy (`declarative_base`), dùng Session từ `Depends(get_db)`.
- **IDs**: Dùng `Integer` cho Primary Key.
- **Timestamps**: Dùng `DateTime`, `default=datetime.utcnow`.
- **ForeignKeys & Relationships**: `Column(Integer, ForeignKey('table.id'))`, `relationship("Model", back_populates="...")`.
- **Migration Framework**: Hiện tại hệ thống không dùng Alembic (chưa có thư mục alembic) và database là `salon.db` (SQLite) cho local dev.
- **Bảng logs hiện có**: `backend/app/models/audit.py` chứa bảng `audit_logs` phục vụ theo dõi thao tác entity CRUD (`action`, `entity_name`, `entity_id`). Nó không phù hợp để theo dõi chi tiết AI (không có trường `model`, `prompt`, `status`, `tokens`).

## 5. Existing Test Coverage

- **Vị trí**: `backend/tests/test_ai.py`, `backend/tests/test_ai_service.py`
- **Coverage**:
  - Có test AI success API flow (status 200).
  - Có test anti-hallucination (`valid_ids = [1, 2]`), kiểm chứng catalog guard.
  - Có kiểm tra Unauthorized (401) và Forbidden (403).
  - **Không có** mock rõ ràng cho `genai.Client` trong các file test, test có vẻ dựa trên fallback hoặc gọi thật (thông qua seed data).
  - **Không có** test lưu trữ log AI vào DB.

## 6. AI_LOGS Requirements

Đề xuất cấu trúc tối thiểu dựa trên thông tin hiện có:

### Required Fields

- `id`: Khóa chính
- `request_type`: Chuỗi phân loại (vd: "recommend", "care_message", "summary")
- `model`: Model được sử dụng
- `status`: Trạng thái xử lý ("SUCCESS", "FALLBACK", "FAILED")
- `created_at`: Thời điểm gọi AI

### Optional Fields

- `user_id`: Integer, ForeignKey(`users.id`) (có thể null nếu khách chưa đăng nhập dùng public API)
- `customer_id`: Integer, ForeignKey(`customers.id`)
- `prompt_details`: Chuỗi/Text hoặc JSON dump thông số input
- `response_details`: Chuỗi/Text hoặc JSON dump kết quả
- `error_message`: Lỗi API nếu có
- `processing_time_ms`: Thời gian xử lý

### Fields That Must Not Be Stored

- Tuyệt đối không lưu API Key, Token.

## 7. Recommended Integration Point

- **OPTION A (Khuyên dùng)**: Ghi log trực tiếp trong `backend/app/services/ai_service.py`.
  - **Lý do**: Đây là nơi nắm rõ trạng thái thật sự (Gemini thành công hay phải dùng Fallback), có quyền truy cập raw JSON và lỗi phát sinh. Việc ghi tại Router (`OPTION B`) sẽ làm mất đi insight về việc "kết quả này đến từ AI hay đến từ Fallback".
  - **Điều kiện**: Cần sửa lại `generate_care_message` tại `ai.py` và `ai_service.py` để inject `db: Session` vào hàm này (hiện tại hàm này không nhận `db`).

## 8. Failure Semantics

- Nếu gọi `gemini` thất bại/timeout, `_generate_with_retry` trả về `None`, system dùng fallback logic. Khi đó log nên ghi nhận status là `FALLBACK` (và có thể capture error log).
- Việc ghi AI_LOGS phải được bọc trong khối `try...except`. Nếu DB insert log thất bại, request AI vẫn phải trả kết quả về cho user bình thường (không được throw exception làm fail user flow).

## 9. Security and Privacy

- Thông tin nhạy cảm của khách hàng (lịch sử) được truyền cho AI prompt. Log lưu dạng nguyên bản có thể dẫn đến tập trung dữ liệu PII vào bảng `ai_logs`. Chỉ lưu `request_type`, metadata ngắn gọn, hoặc cần cơ chế tự động xóa log cũ định kỳ (retention).
- Không được lưu thông tin Header (Authorization).

## 10. Performance Considerations

- Cơ chế hiện tại là synchronous request. Việc ghi thêm một DB record (INSERT) có thể làm tăng thêm thời gian xử lý request; mức tăng cụ thể chưa được benchmark trong phạm vi Phase này.
- Mặc dù lý tưởng nhất là dùng `BackgroundTasks` của FastAPI để ghi log bất đồng bộ, tuy nhiên để tránh over-engineering, ở Phase 1 có thể ghi đồng bộ trực tiếp bằng `db.add()` + `db.commit()` vì khối lượng request AI không quá lớn. (Có thể đề xuất dùng `BackgroundTasks` truyền từ Router nếu team ưu tiên performance tối đa).

## 11. Proposed AI_LOGS Schema

| Field                | Type       | Required | Purpose                               | Source Evidence                       |
| -------------------- | ---------- | -------- | ------------------------------------- | ------------------------------------- |
| `id`                 | Integer    | YES      | Khóa chính                            | Chuẩn theo Base                       |
| `user_id`            | Integer    | NO       | Định danh người gọi API (nếu có)      | `Depends(get_current_user)`           |
| `customer_id`        | Integer    | NO       | Trích xuất từ request                 | `AIRecommendationRequest.customer_id` |
| `request_type`       | String(50) | YES      | Phân loại hành động AI                | Tên các hàm trong `AIService`         |
| `model`              | String(50) | YES      | Tên model Gemini                      | `settings.GEMINI_MODEL`               |
| `status`             | String(20) | YES      | Trạng thái (SUCCESS, FALLBACK, ERROR) | Logic của `_generate_with_retry`      |
| `prompt_details`     | Text       | NO       | Thông tin JSON đầu vào                | Để debug AI                           |
| `response_details`   | Text       | NO       | Phản hồi từ AI hoặc Fallback          | Debug hallucination guard             |
| `error_message`      | Text       | NO       | Chứa lỗi exception khi retry          | `except Exception as e`               |
| `processing_time_ms` | Integer    | NO       | Thời gian xử lý API                   | Giám sát performance                  |
| `created_at`         | DateTime   | YES      | Thời điểm ghi                         | `datetime.utcnow`                     |

## 12. Files That Will Need Modification

Trong PHASE 2, những file sau dự kiến bị sửa đổi:

1. `backend/app/models/ai_log.py` (Tạo mới)
2. `backend/app/models/__init__.py` (Import model mới)
3. `backend/app/routers/ai.py` (Pass `db` và `BackgroundTasks` vào `generate_care_message`)
4. `backend/app/services/ai_service.py` (Thực hiện logic insert log vào database)
5. `backend/tests/test_ai_logs.py` (Tạo test mới)

## 13. Risks

- Tăng trưởng dữ liệu nhanh nếu có người spam gọi `/api/v1/ai/recommend` (vì route này public không cần auth).
- Cần giải quyết việc `ai_service.py` gọi hàm tĩnh (`@staticmethod`). Truyền `db` vào tất cả các method.

## 14. Implementation Plan

- **PHASE 2.1 Model**: Xây dựng `AILog` SQLAlchemy model.
- **PHASE 2.2 Migration**: `Base.metadata.create_all` database init (vì SQLite/chưa có Alembic).
- **PHASE 2.3 Service Integration**: Thay đổi `AIService` methods, bọc logic `try...except` ghi log.
- **PHASE 2.4 Tests**: Viết kiểm thử ghi log cho AI success và AI fallback.
- **PHASE 2.5 Documentation**: Cập nhật lại SPEC.md cho phần Data Models nếu cần thiết.
