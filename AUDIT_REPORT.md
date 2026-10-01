# HE_THONG_SALON — FULL PROJECT AUDIT

## 1. Audit Scope
Cuộc kiểm toán này đối chiếu mã nguồn, cấu trúc dữ liệu, và giao diện hiện tại của dự án `HE_THONG_SALON` với các yêu cầu kỹ thuật và nghiệp vụ được mô tả trong các tài liệu gốc (BaoCaoMoi (1).docx, SPEC.md, README.md, và hệ thống AI Skills/Prompts). Việc kiểm toán hoàn toàn ở chế độ chỉ đọc (Read-Only) để phát hiện các lỗ hổng (gaps), xung đột (conflicts), và rủi ro.

## 2. Sources Audited
- **SOURCE A**: `BaoCaoMoi (1).docx` (Đã đọc qua nội dung trích xuất `report_extract.txt`)
- **SOURCE B**: `SPEC.md`
- **SOURCE C**: `README.md`
- **SOURCE D**: `.agents/rules/` (Không tồn tại)
- **SOURCE E**: `.agents/skills/salon-ai-advisor/SKILL.md` & `.agents/prompt_templates/salon-ai.md`
- **SOURCE F**: Implementation thực tế (`backend/app`, `frontend/src`)
- **SOURCE G**: Tests (`backend/tests`)

## 3. Executive Summary
Dự án cơ bản đã triển khai thành công một hệ thống đặt lịch salon với cấu trúc Client-Server (ReactJS + FastAPI) và ứng dụng tốt Gemini AI. Tuy nhiên, hệ thống đang bộc lộ nhiều điểm không đồng nhất (Conflicts) giữa tài liệu thiết kế (BaoCaoMoi) và triển khai thực tế (Implementation), đặc biệt ở cấu trúc CSDL và việc thiếu hụt một số UI quản trị. `SPEC.md` cũng đã chỉ ra nhiều "code smell" liên quan đến phân quyền RBAC và hiệu suất (N+1 Query).

## 4. Requirement Traceability

| Requirement | Report (Mã) | Implementation | Status | Evidence |
|-------------|-------------|----------------|--------|----------|
| Đăng nhập (Auth) | FR01 | `auth.py`, `LoginPage.jsx` | IMPLEMENTED | API `/auth/login` |
| Quản lý phân quyền | FR02 | `auth_service.py` | PARTIAL | Backend chặn Role nhưng Frontend thiếu UI cấp quyền |
| Quản lý Khách hàng | FR03 | `customers.py`, `CustomersPage.jsx` | IMPLEMENTED | Hỗ trợ CRUD & Lịch sử |
| Quản lý Thợ/Lịch | FR04 | `hairdressers.py`, `StylistsPage.jsx` | IMPLEMENTED | Hỗ trợ CRUD & Ca làm |
| Quản lý Dịch vụ | FR05 | `services.py`, `ServicesPage.jsx` | IMPLEMENTED | Hỗ trợ CRUD |
| Quản lý Lịch hẹn | FR06 | `appointments.py`, `PublicBookingPage.jsx`| IMPLEMENTED | Anti-overlap có hoạt động |
| Hóa đơn & Lịch sử | FR07 | `invoices.py`, `history.py` | IMPLEMENTED | Chuyển trạng thái PAID |
| Tra cứu & Thống kê | FR08 | `analytics.py`, `AnalyticsPage.jsx` | IMPLEMENTED | Doanh thu, Retention |
| AI Hỗ trợ Salon | FR09 | `ai_service.py`, `AIAssistantPage.jsx` | PARTIAL | Thiếu `AI_LOGS` |

## 5. Database Audit

| Requirement | Report (BaoCaoMoi) | Implementation (Code) | Status | Evidence |
|-------------|-------------------|-----------------------|--------|----------|
| Bảng Users | `USERS` (có cột `role` VARCHAR) | `users` và `roles` (tách bảng) | [CONFLICT] | `models/user.py` |
| Bảng Khách | `CUSTOMERS` | `customers` | IMPLEMENTED | `models/customer.py` |
| Bảng Dịch vụ | `SERVICES` | `services` | IMPLEMENTED | `models/service.py` |
| Lịch làm việc| `WORK_SCHEDULES` | `schedules` | IMPLEMENTED | `models/hairdresser.py`|
| Bảng Lịch hẹn| `APPOINTMENTS` | `appointments` | IMPLEMENTED | `models/appointment.py`|
| Chi tiết hẹn | `APPOINTMENT_DETAILS` | `appointment_services` | IMPLEMENTED | `models/service.py` |
| Lịch sử DV | `SERVICE_HISTORIES` | `service_histories` | IMPLEMENTED | `models/history.py` |
| Bảng Hóa đơn | `INVOICES` | `invoices` | IMPLEMENTED | `models/invoice.py` |
| Chi tiết HĐ | `INVOICE_DETAILS` | Không rõ ràng / Bảng `payments` thay thế | [CONFLICT] | `models/payment.py` |
| Nhật ký AI | `AI_LOGS` | Thiếu trong Model | MISSING | `ai_service.py` comment nhắc lưu log nhưng không lưu |
| Log Hệ thống | Không có | `audit_logs` | [CONFLICT] | `models/audit.py` |

## 6. Backend Audit
- **Authentication & RBAC**: Sử dụng JWT và Bcrypt đúng chuẩn. Tuy nhiên logic check quyền đang lặp lại (duplicate) trong `auth_service.py` (theo SPEC.md).
- **Booking**: Thuật toán Anti-overlap được thực thi (được đề cập trong README).
- **Service Layer**: Có chia tách các file service (`ai_service.py`, `booking_service.py`), nhưng `SPEC.md` cảnh báo Router `customers.py` ôm quá nhiều logic (tính thống kê, check duplicate) thay vì đẩy xuống service.

## 7. Frontend Audit
- Các component tồn tại và được wiring: `LoginPage`, `DashboardPage`, `PublicBookingPage`, `AppointmentsPage`, `StylistsPage`, `CustomersPage`, `ServicesPage`, `AIAssistantPage`, `AnalyticsPage`.
- UI/UX đáp ứng yêu cầu (Dark Luxury Theme, TailwindCSS).
- **Thiếu sót**: Không có màn hình nào dành cho **FR02 - Quản lý phân quyền** (Thiếu Users Management / Roles Management UI).

## 8. API Audit
Tất cả các API được định nghĩa trong `frontend/src/services/endpoints.js` đều khớp với backend routers, bao gồm:
- `authAPI`, `serviceAPI`, `hairdresserAPI`, `appointmentAPI`, `customerAPI`, `invoiceAPI`, `paymentAPI`, `analyticsAPI`, `aiAPI`.

## 9. AI Audit
- **Quy tắc AI**: AI Agent bám sát quy tắc "Không ảo giác" bằng cách truyền danh mục `services_catalog` từ DB vào Prompt, kết hợp `temperature=0.2`.
- **Chức năng**: Triển khai đủ 3 hàm: `get_recommendations`, `generate_care_message`, `summarize_customer_history`.
- **Fallback**: Có cơ chế fallback (Hardcoded Rules) khi Gemini API lỗi.
- **[AI-CONFLICT]**: Skill và Spec yêu cầu ghi nhận hệ thống `AI_LOGS`, nhưng `ai_service.py` chỉ để lại comment `# Ghi nhận nhật ký AI nếu hệ thống có triển khai AI_LOGS.` mà chưa gọi DB insert.

## 10. Authentication & RBAC Audit
- Có hoạt động.
- Dính Code Smell (Spec.md): Hardcode chuỗi quyền `"admin"`, `"receptionist"` ở cấp độ router thay vì sử dụng Enum tập trung; cấp quyền đọc cho Stylist nhưng chưa chặn bằng `customer_id` theo phạm vi sở hữu (Data-level scoping chưa triệt để ngoại trừ trong AI Summary).

## 11. Testing Audit
- Theo `README.md`, có 17 bài test (16 pass, 1 fail).
- Test bị fail liên quan đến kiểm tra overlap ngày nghỉ của stylist.

## 12. Integration Audit
- Tích hợp thành công `google-genai` SDK.
- Dữ liệu Frontend - Backend truyền nhận JSON ổn định.

## 13. Orphan / Dead Code Audit
- Thư mục `.agent-backup/` chứa backup code, không ảnh hưởng vận hành nhưng làm rác thư mục gốc.
- `report_extract.txt` là file tạm không cần thiết.
- Tồn tại **N+1 Query** trong API List Customer (cảnh báo từ `SPEC.md`).

## 14. Specification Conflicts

**[CONFLICT] 1: Cấu trúc User và Role**
- **Requirement**: Cấu trúc bảng User và RBAC.
- **Source A**: `BaoCaoMoi (1).docx` định nghĩa bảng `USERS` có cột `role` kiểu VARCHAR để phân quyền.
- **Source B**: Không đề cập chi tiết DB.
- **Source F (Code)**: Implementation lại chuẩn hóa thành bảng `roles` riêng và khóa ngoại `role_id` ở bảng `users`.
- **Difference**: Thiết kế chuẩn hóa (Normalized) vs Phi chuẩn hóa (Denormalized).
- **Impact**: Code không khớp hoàn toàn với Báo cáo, ảnh hưởng tài liệu thiết kế.
- **Recommended human decision**: Cập nhật lại Báo cáo (BaoCaoMoi) để phản ánh cấu trúc chuẩn hóa `roles` của database thực tế.

**[CONFLICT] 2: Cơ chế lưu hóa đơn và thanh toán**
- **Requirement**: Cấu trúc lưu trữ dữ liệu thanh toán, hóa đơn.
- **Source A**: `BaoCaoMoi (1).docx` mô tả `INVOICES` và `INVOICE_DETAILS`.
- **Source B**: Không đề cập.
- **Source F (Code)**: Implementation có bảng `invoices` và bảng bổ sung `payments`, nhưng có vẻ thiếu chi tiết hóa đơn (Invoice Details).
- **Difference**: Cách lưu vết dòng tiền và chi tiết dịch vụ thanh toán.
- **Impact**: Khó khăn trong việc xuất hóa đơn VAT chi tiết theo dịch vụ thực tế.
- **Recommended human decision**: Bổ sung bảng `INVOICE_DETAILS` vào CSDL hoặc sửa đổi tài liệu báo cáo để chấp nhận thiết kế hiện tại với bảng `payments`.

## 15. Missing Requirements
- Bảng `AI_LOGS` chưa được tạo và lưu (Missing FR09 audit constraint).
- Thiếu Frontend UI cho chức năng Quản lý phân quyền và người dùng (Missing FR02 UI).

## 16. Partial Requirements
- RBAC chặn được truy cập ở Backend API nhưng logic bị trùng lặp, thiếu Scope Constraint (cho phép Thợ làm tóc xem toàn bộ thông tin lịch sử của tất cả khách hàng).

## 17. Implemented Requirements
- Các chức năng lõi: Đăng nhập/Xác thực, Đặt lịch, Chống trùng lịch (Anti-overlap Booking), API AI hỗ trợ, Quản lý (Khách, Thợ, Dịch vụ, Hóa đơn), Dashboard Thống kê.

## 18. Risk List
- Lỗi logic Overlap trong Unit Test chưa được fix.
- N+1 Query làm nghẽn hệ thống Backend (API Customers) nếu dữ liệu Khách hàng phình to.
- RBAC Hardcoded lặp lại ở nhiều nơi (Code smells) dễ gây bug bảo mật nếu có thêm Role mới.
- Tính năng Public Booking dễ bị spam nếu không có Rate Limiting hoặc Captcha bảo vệ API.

## 19. GAP Summary
Sự khác biệt lớn nhất giữa Thiết kế và Thực tế nằm ở thiết kế CSDL (Roles, Payments thay cho Invoice Details) và việc không thực hiện lưu nhật ký AI (`AI_LOGS`). Giao diện Frontend còn thiếu module quản trị User/Role (FR02). Ngoài ra, nợ kỹ thuật (Technical Debt) như N+1 Query và RBAC Duplicate Logic cần được giải quyết.

## 20. Recommended Fix Order

### TOP PRIORITY GAPS
- **P0 — Critical**: Sửa lỗi Test Case Overlap ngày nghỉ của Stylist để ngăn chặn đặt lịch sai (nguy cơ lỗi tính năng cốt lõi).
- **P1 — High**: Fix lỗi N+1 Query trong list Customer API; Triển khai tạo bảng `AI_LOGS` để ghi nhật ký hoạt động AI.
- **P2 — Medium**: Xây dựng UI Quản lý tài khoản và phân quyền cho Admin trên Frontend.
- **P3 — Low**: Refactor lại logic RBAC ở Backend (sử dụng Enums, loại bỏ code kiểm tra if/else dư thừa theo chỉ dẫn của `SPEC.md`); Xóa file rác (`report_extract.txt`, thư mục backup).
