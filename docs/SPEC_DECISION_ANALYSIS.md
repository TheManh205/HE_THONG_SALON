# SPEC Decision Analysis

## 1. Executive Summary
Tài liệu này cung cấp phân tích chi tiết cho 3 quyết định kiến trúc quan trọng (Architectural Gaps) được phát hiện trong quá trình Audit: Cấu trúc quản lý Role, Cấu trúc hóa đơn/thanh toán, và Yêu cầu lưu vết AI (AI Logging). Mục tiêu của tài liệu là phân tích rủi ro, ảnh hưởng đến mã nguồn hiện hành và đề xuất các lựa chọn (Options) để người dùng có cái nhìn tổng quan trước khi ra quyết định, tuyệt đối không can thiệp hay tự động thay đổi mã nguồn hệ thống.

## 2. Source of Truth
Các quyết định phân tích dựa trên sự đối chiếu giữa:
- **Tài liệu gốc**: `BaoCaoMoi (1).docx`, `SPEC.md`, `.agents/skills/salon-ai-advisor/SKILL.md`
- **Tài liệu kiểm toán**: `AUDIT_REPORT.md`, `GAP_ANALYSIS.md`
- **Mã nguồn thực tế**: `backend/`, `frontend/`, `database/`, và các file `tests/` hiện có.

## 3. Current Verified Test Status
Dựa trên lần chạy kiểm thử thực tế gần nhất, trạng thái hệ thống ghi nhận:
- Current verified test result: **22 pytest tests**
- **22 PASSED**
- **0 FAILED**

*(Lưu ý: Tài liệu README.md đang có thông tin stale (lỗi thời) báo cáo "1 test fail ở phần overlap ngày nghỉ", nhưng kết quả chạy thực tế xác nhận 100% test PASSED. Test suite đang hoạt động ổn định)*

## 4. DECISION-001 — USERS.role vs roles

### 4.1 Report Requirement
Tài liệu `BaoCaoMoi (1).docx` định nghĩa bảng `USERS` có chứa một trường tên là `role` (kiểu VARCHAR) để quản lý phân quyền người dùng. Đây là thiết kế cơ sở dữ liệu phẳng (Denormalized).

### 4.2 Current Implementation
Mã nguồn thực tế (tại `backend/app/models/user.py`) đang triển khai cấu trúc cơ sở dữ liệu chuẩn hóa (Normalized). Cụ thể, có một bảng `roles` riêng biệt, và bảng `users` chứa khóa ngoại `role_id` liên kết đến bảng `roles`.

### 4.3 Dependency Analysis
- **Model**: `backend/app/models/user.py` (chứa class `Role` và `User`).
- **Auth & RBAC**: `backend/app/services/auth_service.py` (logic phân quyền `require_roles` check qua string lấy từ `user.role.name`).
- **Router**: `backend/app/routers/auth.py`, `backend/app/routers/users.py`.
- **Frontend**: Chưa có UI quản lý Role (không có Users Management Page), frontend chỉ nhận thông tin Role qua JWT Auth từ API.
- **Tests**: `backend/tests/test_auth.py` có fixture phụ thuộc vào cấu trúc bảng roles.
- **Migration/Database**: Schema SQL đang sử dụng bảng `roles`.
- **Seed Data**: Dữ liệu khởi tạo (nếu có) phải chèn vào bảng roles trước khi chèn vào bảng users.

### 4.4 Option A (Tuân thủ tuyệt đối Report)
**Xóa bảng roles, dùng USERS.role:**
- Cần sửa: Drop bảng `roles`, sửa model `User`, sửa đổi `auth_service.py`, `test_auth.py`.
- Ảnh hưởng: Phá vỡ toàn bộ module Authentication ở Backend.

### 4.5 Option B (Giữ Code, Sửa Report)
**Giữ nguyên cấu trúc roles hiện tại:**
- Cần sửa: Chỉnh lý tài liệu `BaoCaoMoi (1).docx` và `SPEC.md`.
- Ảnh hưởng: Không tác động đến hệ thống phần mềm, nhưng phải xin phê duyệt sửa tài liệu đồ án/kỹ thuật.

### 4.6 Compatibility Options
**Hybrid / Tương thích:**
- Giữ bảng `roles` trong CSDL, nhưng sửa Backend API để luôn expose một property `role` phẳng cho Frontend/Client (như hiện tại đang làm qua JWT).
- Database giữ nguyên, Report coi như là góc nhìn API logic.

### 4.7 Migration Risk
- Nếu đi theo Option A: **CAO** (Dễ gây hỏng data user đăng nhập).
- Nếu đi theo Option B: **KHÔNG RỦI RO**.

### 4.8 Testing Impact
- Nếu đi theo Option A: 100% test liên quan đến Auth sẽ FAILED và cần viết lại.

### 4.9 Recommendation Analysis
Mô hình chuẩn hóa (Bảng roles riêng - Option B) linh hoạt hơn khi cần thêm Role mới (ví dụ Manager) mà không phải lặp data. Cấu trúc mã nguồn đang chạy rất tốt, không nên đập đi xây lại trừ khi nghiệp vụ kinh doanh ép buộc nghiêm ngặt.

### 4.10 Final Decision
**PENDING USER DECISION**

---

## 5. DECISION-002 — INVOICE_DETAILS vs payments

### 5.1 Report Requirement
Tài liệu `BaoCaoMoi (1).docx` yêu cầu một bảng `INVOICE_DETAILS` để liên kết hóa đơn với các dịch vụ đã sử dụng, bao gồm các field như `quantity`, `unit_price`, `amount`.

### 5.2 Current Implementation
Mã nguồn hiện tại sử dụng bảng `payments` (`backend/app/models/payment.py`) tập trung lưu thông tin giao dịch (`amount`, `payment_method`, `payment_status`).
Để biết dịch vụ nào trong hóa đơn, hệ thống đang phụ thuộc vào bảng `appointment_services` (chứa `price_at_booking`), hoàn toàn bỏ qua khái niệm `invoice_details`.

### 5.3 Dependency Analysis
- **Model**: `backend/app/models/payment.py`, `backend/app/models/invoice.py`, `backend/app/models/service.py` (cho `appointment_services`).
- **Service**: `backend/app/services/payment_service.py`.
- **API**: `backend/app/routers/payments.py`.
- **Frontend**: Gọi API qua `frontend/src/services/endpoints.js` (`paymentAPI`).
- **Tests**: `backend/tests/test_services_invoices.py`.

### 5.4 Option A (Tuân thủ tuyệt đối Report)
**Đổi payments thành INVOICE_DETAILS:**
- Cần sửa: Phải sinh ra model `InvoiceDetail`. Xóa bỏ hoặc điều chỉnh model `Payment`.
- Ảnh hưởng: API tạo hóa đơn sẽ phải map `appointment_services` sang `invoice_details`. Quản lý luồng tiền (Cash flow) sẽ gặp khó vì Report không có bảng thanh toán riêng.

### 5.5 Option B (Giữ nguyên payments)
**Giữ payments, bỏ INVOICE_DETAILS:**
- Cần sửa: Cập nhật Report.
- Ảnh hưởng: Phải lý giải trong tài liệu rằng `appointment_services` có vai trò tương đương `invoice_details`.

### 5.6 Compatibility Options
**Thêm INVOICE_DETAILS, giữ nguyên payments:**
- Chấp nhận bổ sung thêm model `InvoiceDetail` vào DB phục vụ riêng cho tác vụ in ấn hóa đơn tài chính. Model `Payment` vẫn chịu trách nhiệm lưu trạng thái tiền mặt/chuyển khoản.
- Mã nguồn sẽ phức tạp hơn một chút nhưng đáp ứng đủ 100% tài liệu và nghiệp vụ thực tế.

### 5.7 Migration Risk
- Đi theo Option A/C: **CAO** (Can thiệp vào quy trình Checkout booking).

### 5.8 Testing Impact
- Sẽ gây ảnh hưởng trực tiếp và làm FAILED hàm `test_invoice_creation_and_service_history`.

### 5.9 Recommendation Analysis
Xóa bỏ bảng `payments` (Option A) rất nguy hiểm vì Salon cần phân biệt Cash/Card. Tuy nhiên, việc thiếu `invoice_details` khiến hệ thống khó tính toán xuất hóa đơn thuế nếu dịch vụ bị hủy 1 nửa sau booking. Option Compatibility (Giữ payments + Thêm invoice_details) là lý tưởng nhất về mặt phần mềm lâu dài.

### 5.10 Final Decision
**PENDING USER DECISION**

---

## 6. DECISION-003 — AI_LOGS

### 6.1 Requirement Analysis
Tài liệu `BaoCaoMoi (1).docx` và AI Skill (`salon-ai-advisor/SKILL.md`) yêu cầu phải có tính năng lưu trữ vết (logging) AI, được gọi là `AI_LOGS`. 

### 6.2 Current AI Implementation
Module `backend/app/services/ai_service.py` tích hợp Gemini SDK hoạt động tốt, chặn ảo giác bằng `temperature=0.2` và validator, đáp ứng yêu cầu.

### 6.3 Current Logging
Hoàn toàn **không tồn tại** database persistence cho `AI_LOGS`. 
File `ai_service.py` chỉ có chú thích: `# Ghi nhận nhật ký AI nếu hệ thống có triển khai AI_LOGS.`, sử dụng application logging thông thường chứ không Insert vào CSDL.

### 6.4 Missing Capabilities
- Không lưu Customer/User đã trigger prompt.
- Không lưu nội dung Prompt / Request.
- Không lưu Response của Gemini để Audit.
- Không lưu Status (Thành công, Lỗi API, Hay chạy vào Fallback).

### 6.5 Proposed Schema
Nếu triển khai, cần tạo mô hình `AILog` với các trường:
- `id` (Integer, PK)
- `customer_id` (FK to customers, Nullable)
- `endpoint` (String)
- `prompt_content` (Text)
- `response_content` (Text)
- `created_at` (DateTime)

### 6.6 Security/Privacy
Lưu nội dung AI có thể chứa thông tin cá nhân (SDT, Tên). Cần cân nhắc mã hóa (Encryption) hoặc không lưu raw text mà chỉ lưu ID dịch vụ được recommend.

### 6.7 Performance
Insert Log tuần tự sẽ cản trở API response time (Gemini API đã tốn thời gian). Cần thiết kế chạy bất đồng bộ (e.g. `fastapi.BackgroundTasks`) để lưu DB.

### 6.8 Testing
Hiện không có test nào bị fail vì chức năng này chưa tồn tại. Phải viết thêm test nếu thêm tính năng.

### 6.9 Implementation Impact
Đây là một **Additive change** (Chỉ thêm vào, không phá code cũ). Rủi ro rất thấp.

### 6.10 Final Decision
**PENDING USER DECISION**

---

## 7. Cross-Decision Dependency
- 3 quyết định này **không phụ thuộc** trực tiếp vào nhau. 
  - DECISION-001 dính tới lõi Auth.
  - DECISION-002 dính tới lõi Tài chính / Booking.
  - DECISION-003 dính tới Audit / AI Observability.
- Điểm chung: Nếu cả 3 đều được phê duyệt thay đổi ở Backend, chúng nên được gộp chung vào 1 quá trình Alembic Database Migration duy nhất để tránh xung đột lịch sử schema.

## 8. Recommended Implementation Order
*Chỉ dựa trên kỹ thuật (Dependency/Risk), nếu được duyệt để triển khai:*
1. **Giai đoạn 1**: Xử lý `DECISION-003 (AI_LOGS)`. Rủi ro thấp nhất (Thêm mới), không phá vỡ logic cốt lõi.
2. **Giai đoạn 2**: Xử lý `DECISION-001 (USERS.role)`. Rủi ro trung bình. Backend Auth có thể điều chỉnh ngầm mà Frontend không bị sập.
3. **Giai đoạn 3**: Xử lý `DECISION-002 (INVOICE_DETAILS)`. Rủi ro cao nhất. Gây ảnh hưởng trực tiếp đến logic Checkout, Lịch sử đặt lịch và Báo cáo doanh thu.

## 9. Files Affected
*(Danh sách các file sẽ có khả năng bị sửa đổi tuỳ thuộc vào quyết định)*
- `backend/app/models/user.py`
- `backend/app/models/payment.py` / Sinh mới `invoice_detail.py`
- `backend/app/services/auth_service.py`
- `backend/app/services/payment_service.py`
- `backend/app/services/ai_service.py`
- `backend/tests/test_auth.py`
- `backend/tests/test_services_invoices.py`
- `BaoCaoMoi (1).docx` & `SPEC.md` (Nếu quyết định giữ Code, sửa Doc)
- `README.md` (Sẽ được fix thông tin Test staled)

## 10. Decision Checklist

- [ ] DECISION-001 (USERS.role vs roles)
- [ ] DECISION-002 (INVOICE_DETAILS vs payments)
- [ ] DECISION-003 (AI_LOGS requirement)
