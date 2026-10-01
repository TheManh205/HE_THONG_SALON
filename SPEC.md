# SPEC.md — Module: Quản lý Khách hàng

## 1. Mục tiêu module theo trạng thái hiện tại

Module Quản lý Khách hàng hiện đang triển khai các chức năng CRUD và xem lịch sử dịch vụ cho khách hàng trong hệ thống salon. API được định nghĩa trong [backend/app/routers/customers.py](backend/app/routers/customers.py), với dữ liệu nền trong [backend/app/models/customer.py](backend/app/models/customer.py), [backend/app/models/appointment.py](backend/app/models/appointment.py), [backend/app/models/invoice.py](backend/app/models/invoice.py), [backend/app/models/history.py](backend/app/models/history.py), và quyền truy cập kiểm soát ở [backend/app/services/auth_service.py](backend/app/services/auth_service.py).

Theo mã hiện tại, module này đang hỗ trợ:
- Xem danh sách khách hàng với tìm kiếm nâng cao
- Xem chi tiết khách hàng
- Tạo khách hàng mới
- Cập nhật thông tin khách hàng
- Xem lịch sử dịch vụ theo khách hàng

## 2. Luồng dữ liệu hiện tại đang chạy như thế nào?

### 2.1. Xác thực và phân quyền

- Người dùng đăng nhập qua endpoint trong [backend/app/routers/auth.py](backend/app/routers/auth.py) (được gọi từ `AuthService.authenticate` trong [backend/app/services/auth_service.py](backend/app/services/auth_service.py)).
- Sau khi đăng nhập, hệ thống tạo JWT chứa:
  - `sub`: user id
  - `role`: role name (admin, receptionist, hairdresser)
- Mỗi request tới module khách hàng đều đi qua dependency `Depends(require_roles(...))`.
- `require_roles` được triển khai trong [backend/app/services/auth_service.py](backend/app/services/auth_service.py):
  - nếu user role nằm trong danh sách cho phép thì được phép truy cập
  - nếu role là `admin`, có cơ chế bypass đặc biệt
  - nếu không thỏa điều kiện thì trả 403 Forbidden

Cần lưu ý: flow thực tế đang là:
1. Login -> token
2. Token được gửi trong Authorization header
3. FastAPI resolve `get_current_user()`
4. `require_roles(...)` kiểm tra role
5. Nếu hợp lệ, route thực thi

### 2.2. Luồng đọc danh sách khách hàng

Endpoint: `GET /customers/` trong [backend/app/routers/customers.py](backend/app/routers/customers.py)

Flow hiện tại:
1. Validate role: `admin`, `receptionist`, `hairdresser`
2. Nhận query params:
   - `search`
   - `skip`
   - `limit`
3. Tạo query `db.query(Customer)`
4. Nếu có `search`, lọc theo `full_name`, `phone`, `email` với `ilike()`
5. Dùng `query.offset(skip).limit(limit).all()` để lấy khách hàng
6. Với từng khách hàng, tính thêm thống kê:
   - `appointment_count` = số lịch hẹn có `customer_id == c.id`
   - `total_spent` = tổng `Invoice.final_amount` với `payment_status == PAID`
7. Chuyển đối tượng SQLAlchemy thành `CustomerResponse` và gắn thêm 2 field động
8. Trả danh sách JSON

Lưu ý: thao tác này đang chạy theo kiểu N+1 query:
- Một query lấy khách hàng
- Với mỗi khách hàng, một query tính số lịch hẹn
- Với mỗi khách hàng, một query tính tổng tiền đã thanh toán

### 2.3. Luồng xem chi tiết khách hàng

Endpoint: `GET /customers/{customer_id}` trong [backend/app/routers/customers.py](backend/app/routers/customers.py)

Flow:
1. Kiểm tra `customer_id`
2. Query `Customer` theo id
3. Nếu không có -> trả 404
4. Tính lại:
   - `appointment_count`
   - `total_spent`
5. Gắn vào `CustomerResponse`
6. Trả thông tin khách hàng

### 2.4. Luồng tạo khách hàng

Endpoint: `POST /customers/` trong [backend/app/routers/customers.py](backend/app/routers/customers.py)

Flow:
1. Validate role: `admin`, `receptionist`
2. Nhận body `CustomerCreate`
3. Kiểm tra xem số điện thoại đã tồn tại chưa: `db.query(Customer).filter(Customer.phone == customer_in.phone).first()`
4. Nếu trùng -> trả 400
5. Nếu chưa trùng: tạo đối tượng `Customer(**customer_in.model_dump())`
6. `db.add(customer)`, `db.commit()`, `db.refresh(customer)`
7. Trả đối tượng khách hàng vừa tạo

### 2.5. Luồng cập nhật khách hàng

Endpoint: `PUT /customers/{customer_id}` trong [backend/app/routers/customers.py](backend/app/routers/customers.py)

Flow:
1. Validate role: `admin`, `receptionist`
2. Query customer theo id
3. Nếu không tồn tại -> 404
4. Lấy dữ liệu update từ `CustomerUpdate` (`exclude_unset=True`)
5. Nếu trong dữ liệu update có field `phone` và khác với phone cũ, kiểm tra trùng lặp với khách hàng khác
6. Gán từng field lên object `customer`
7. Commit và refresh
8. Trả object cập nhật

### 2.6. Luồng xem lịch sử dịch vụ khách hàng

Endpoint: `GET /customers/{customer_id}/history` trong [backend/app/routers/customers.py](backend/app/routers/customers.py)

Flow:
1. Validate role: `admin`, `receptionist`, `hairdresser`
2. Query customer theo id
3. Nếu không tìm thấy -> 404
4. Query `ServiceHistory` theo `customer_id`
5. Sắp xếp theo `completed_at DESC`
6. Trả danh sách lịch sử dịch vụ

### 2.7. Dữ liệu nền của module

Model chủ chốt:
- [backend/app/models/ai_log.py](backend/app/models/ai_log.py): lưu nhật ký (audit log) cho các tương tác AI.
- [backend/app/models/customer.py](backend/app/models/customer.py): lưu thông tin khách hàng
- [backend/app/models/appointment.py](backend/app/models/appointment.py): lịch hẹn của khách với thợ
- [backend/app/models/history.py](backend/app/models/history.py): lịch sử dịch vụ đã hoàn thành
- [backend/app/models/invoice.py](backend/app/models/invoice.py): hóa đơn (Invoice header)
- [backend/app/models/payment.py](backend/app/models/payment.py): bảng `payments` quản lý giao dịch thanh toán. Các trường lưu trữ gồm có: phương thức thanh toán, trạng thái thanh toán, mã tham chiếu/giao dịch (`transaction_code`) và thời gian thanh toán (`paid_at`).
- [backend/app/models/service.py](backend/app/models/service.py): quản lý dịch vụ và chi tiết dịch vụ đã chọn (`appointment_services`). Bảng `appointment_services` lưu trữ dịch vụ được chọn cho lịch hẹn cùng giá tại thời điểm đặt (`price_at_booking`), qua đó cung cấp thông tin dòng chi tiết dịch vụ cho việc xuất hóa đơn và thanh toán. Trong kiến trúc hiện tại, thông tin chi tiết dịch vụ dùng cho hóa đơn được lấy từ `appointment_services`; không triển khai bảng vật lý `INVOICE_DETAILS`.
- [backend/app/models/user.py](backend/app/models/user.py): thông tin người dùng. Bảng `roles` là nguồn sự thật (source of truth) cho cơ sở dữ liệu RBAC; `users` tham chiếu đến `roles` thông qua khóa ngoại `users.role_id → roles.id`. Tầng API có thể trả về `role` dưới dạng chuỗi (string) để thuận tiện, tuy nhiên không tồn tại sự trùng lặp nguồn dữ liệu dạng cột vật lý `users.role` trong cơ sở dữ liệu.

Mối quan hệ đang có:
- customer -> appointments
- customer -> invoices
- customer -> service_histories
- user -> role_id -> roles
- user -> hairdresser
- appointment -> appointment_services
- appointment -> invoice
- invoice -> payments
- users -> ai_logs
- customers -> ai_logs

### 2.8. Kiến trúc AI và AI Logging

Hệ thống cung cấp tính năng AI (Gemini + Structured output + Catalog guard / validation + Fallback + Persistent AI_LOGS audit trail) với kiến trúc như sau.

**1. AI Flow**
Luồng xử lý AI tuân theo trình tự thực tế:
1. Client gửi yêu cầu.
2. Router tiếp nhận request.
3. `AIService` xử lý nghiệp vụ AI.
4. Gửi request tới Gemini (AI provider).
5. Output được Parsing và Catalog Validation (đảm bảo recommendation chỉ sử dụng service hợp lệ trong catalog).
6. Nếu Gemini không phản hồi hợp lệ hoặc output thất bại, Fallback engine được sử dụng.
7. Sau khi xác định kết quả cuối cùng (Final response + status), hệ thống ghi vào `AI_LOGS`.
8. Trả response về cho Client.

*Lưu ý:* Lỗi trong quá trình ghi `AI_LOGS` không được phép làm request AI chính bị crash. Cơ chế logging được bảo vệ bằng xử lý exception và rollback transaction khi cần.

**2. Các loại request (Request Type)**
Hệ thống hiện tại hỗ trợ 3 loại request chính:
- `recommend`: Đề xuất dịch vụ.
- `care_message`: Tạo tin nhắn chăm sóc khách hàng.
- `summary`: Tóm tắt lịch sử khách hàng.

**3. Ý nghĩa các trạng thái (Status Semantics)**
- **SUCCESS**: Gemini trả về response hợp lệ và response vượt qua bước parsing/catalog validation.
- **FALLBACK**: Gemini không tạo được response hợp lệ hoặc output không thể parse/validation thất bại, sau đó hệ thống sử dụng fallback engine để tạo response. (Ví dụ: Gemini unavailable/offline, không có API key, JSON response lỗi, response không đạt validation, v.v.).
- **ERROR**: Request không thể tạo được response cuối cùng hợp lệ hoặc request phát sinh lỗi nghiệp vụ/hệ thống khiến quá trình xử lý thất bại.

**4. Mô hình dữ liệu AI_LOGS**
Dữ liệu log được lưu vào bảng `ai_logs` thông qua registry, khởi tạo bằng `Base.metadata.create_all(bind=engine)` (không sử dụng Alembic migration).

| Field | Type | Nullable | Ý nghĩa |
|---|---|---|---|
| id | Integer | Không | Primary key |
| user_id | Integer | Có | FK → users.id |
| customer_id | Integer | Có | FK → customers.id |
| request_type | String(50) | Không | Loại yêu cầu AI |
| model | String(50) | Không | Model AI được sử dụng |
| status | String(20) | Không | SUCCESS / FALLBACK / ERROR |
| prompt_details | Text | Có | Thông tin request phù hợp để audit |
| response_details | Text | Có | Thông tin response phù hợp để audit |
| error_message | Text | Có | Thông tin lỗi nếu có |
| processing_time_ms | Integer | Có | Thời gian xử lý request tính bằng milliseconds |
| created_at | DateTime | Không | Thời điểm tạo log |

*Ghi chú:*
- Foreign key `user_id` và `customer_id` đều nullable vì một AI request có thể không gắn với user hoặc customer. Khóa ngoại tham chiếu `AI_LOGS.user_id → users.id` và `AI_LOGS.customer_id → customers.id`.
- `processing_time_ms` được tính bằng `time.perf_counter()`. `created_at` là timestamp của log, không phải processing duration (`created_at ≠ processing_time_ms`).

**5. Security & Testing**
- **Security**: AI_LOGS chỉ lưu thông tin cần thiết cho mục đích audit/debug/monitoring và không lưu credentials hoặc authentication secrets. Các thông tin nhạy cảm như Gemini API key, JWT/access token, Authorization header, và password KHÔNG ĐƯỢC LƯU và phải được loại khỏi dữ liệu log.
- **Testing**: Toàn bộ test suite hiện tại đạt 27 passed / 0 failed tại thời điểm kiểm thử Phase 2. Các nhóm test kiểm chứng AI_LOGS bao gồm: AI log persistence, SUCCESS logging, FALLBACK logging, JSON parsing failure → FALLBACK, ERROR logging, user_id persistence, customer_id persistence, Sensitive-data protection (JWT/access token/Authorization/password không bị ghi vào log).

## 3. Có đoạn logic nào đang bị thừa, lặp lặp, hoặc vi phạm nguyên tắc RBAC không?

### 3.1. RBAC đang có logic lặp và khó đọc

Trong [backend/app/services/auth_service.py](backend/app/services/auth_service.py), hàm `require_roles()` hiện có logic lặp như sau:

- Kiểm tra 1:
  `if user_role not in allowed_roles and "admin" not in allowed_roles:`
- Sau đó lại kiểm tra 1 lần nữa:
  `if user_role not in allowed_roles and user_role != "admin":`

Những điều kiện này là dư thừa và chồng chéo. Chúng đã tạo ra:
- logic khó đọc
- nguy cơ sai logic khi mở rộng role mới
- khó bảo trì vì cùng một quyết định được kiểm tra hai lần

Cơ chế admin bypass cũng đang được triển khai theo kiểu “if-then-later-check” rất thừa:
- nếu `allowed_roles` không chứa `admin` nhưng user là admin, vẫn vào nhánh xử lý
- rồi lại có nhánh kiểm tra thứ hai

Nói ngắn gọn: logic RBAC đang thực hiện cùng một quyết định hai lần thay vì tập trung ở 1 điểm duy nhất.

### 3.2. Quản lý quyền hiện đang không thực sự “phân quyền theo vai trò” chặt chẽ

Các route khách hàng đang phân quyền như sau:
- `GET /customers/` -> `admin`, `receptionist`, `hairdresser`
- `GET /customers/{id}` -> `admin`, `receptionist`, `hairdresser`
- `POST /customers/` -> `admin`, `receptionist`
- `PUT /customers/{id}` -> `admin`, `receptionist`
- `GET /customers/{id}/history` -> `admin`, `receptionist`, `hairdresser`

Điều này có 3 vấn đề đáng chú ý:

1. `hairdresser` được phép xem danh sách khách hàng và lịch sử dịch vụ, nhưng không được phép tạo hoặc sửa khách hàng.
   - Đây là một mô hình “read-only” cho thợ, hợp lý nếu muốn giới hạn quyền nhưng cần phải rõ ràng theo policy.

2. Tuy nhiên, ở cấp mã, quyền được kiểm tra bằng string literal lặp đi lặp lại (`"admin"`, `"receptionist"`, `"hairdresser"`) trên nhiều route.
   - Điều này làm RBAC khó quản lý khi cần tăng thêm vai trò hoặc điều chỉnh quyền.

3. Không có kiểm tra role theo “scope” hoặc “resource ownership”.
   - Ví dụ: `hairdresser` có thể xem thông tin khách hàng nhưng không có kiểm tra nào yếu tố `customer_id` thuộc về thợ đó hay không.
   - Tức là quyền “xem” đang rộng hơn “xem đúng phạm vi”.

### 3.3. Logic tính thống kê đang bị lặp lại

Trong [backend/app/routers/customers.py](backend/app/routers/customers.py), cả `get_customers()` và `get_customer()` đều lặp logic:
- query appointment by customer_id
- query total spent by customer_id and `PAID`
- convert to response and append stats

Đây là code smell rõ ràng vì:
- logic nghiệp vụ bị dính trực tiếp vào layer route
- khó tái sử dụng ở các endpoint khác
- tăng nguy cơ lệch logic giữa list và detail nếu cần sửa sau này

### 3.4. Kiểm tra trùng phone đang duplicate

Trong `create_customer()` và `update_customer()`, logic kiểm tra duplicate phone được lặp lại ở hai nơi. Đây là:
- duplication logic
- không tuân nguyên tắc Keep It DRY
- dễ phát sinh sai lệch giữa create và update

### 3.5. Route đang chứa quá nhiều trách nhiệm

`get_customers()` không chỉ “lấy dữ liệu”, mà còn:
- thực hiện filtering
- thực hiện thống kê doanh thu
- thực hiện mapping response
- thực hiện business validation (thông qua dependency)

Điều này làm route trở thành “controller + service + aggregation + transformer” đồng thời, vi phạm tách lớp rõ ràng.

## 4. Các điểm bất thường (Code smell) trong cấu trúc file hiện tại

### 4.1. Router vừa là API layer vừa là business logic layer

[backend/app/routers/customers.py](backend/app/routers/customers.py) đang xử lý nhiều việc cùng lúc:
- query SQLAlchemy
- lọc dữ liệu
- tính tổng tiền doanh thu
- kiểm tra trùng số điện thoại
- tạo object và commit
- cấu hình response

Điểm này là smell lớn nhất của module hiện tại.

### 4.2. N+1 query trong danh sách khách hàng

Trong `get_customers()`, vòng lặp for mỗi khách hàng gọi thêm query để tính:
- appointment count
- total spent

Với danh sách lớn, hiệu suất sẽ suy giảm rõ rệt.

### 4.3. Lặp lại string role và logic điều kiện

Role strings được lặp lại nhiều nơi:
- auth service
- các router
- seed data trong [backend/app/utils/seed.py](backend/app/utils/seed.py)

Việc dùng string literal phân quyền trên nhiều nơi tạo risk:
- typo role name
- khó kiểm soát quyền
- khó mở rộng thành RBAC cấp quyền chi tiết hơn

### 4.4. `current_user` không được sử dụng trong route

Trong nhiều route như `get_customers`, `get_customer`, `create_customer`, `update_customer`, `get_customer_service_history`, tham số `current_user` được thêm vào nhưng không được dùng trong body logic. Đây là smell vì:
- tham số tồn tại chỉ để dependency bắt buộc
- không cho thấy business rule nào dựa trên người dùng đang đăng nhập
- ngụ ý route đang không làm gì với identity ngoài RBAC gate

### 4.5. Có “magic values” và không có enum/constant tập trung

Các vai trò đang được viết dưới dạng string cố định, ví dụ:
- `"admin"`
- `"receptionist"`
- `"hairdresser"`

Nếu cần kiểm tra, mở rộng hoặc map quyền theo nghiệp vụ, việc này sẽ dễ sai và khó khai báo rõ ràng hơn bằng enum hoặc constant layer.

### 4.6. Logic phân quyền đang có “Admin bypass” không nhất quán

`require_roles()` làm admin được phép truy cập nhưng lại có hai nhánh lặp. Có 2 trạng thái khác nhau nhưng cùng mục đích, khiến code khó suy diễn. Đây là smell hiển nhiên trong logic flow.

### 4.7. `CustomerResponse.model_validate(c)` được gọi trên object SQLAlchemy không rõ định nghĩa response mapping

Object trả về có thể chứa dữ liệu thừa hoặc không đồng nhất với UI đang cần. Việc dùng `model_validate` ở nhiều nơi trực tiếp khiến response schema bị “gắn” vào model và dễ lệch với business contract sau này.

### 4.8. `ServiceHistory` được trả thẳng mà không có filter bổ sung theo người đang đăng nhập

Trong `get_customer_service_history()`, role được kiểm tra nhưng không có logic khác nhau theo người dùng. Ví dụ:
- hairdresser có thể xem toàn bộ lịch sử service history của mọi khách hàng nếu đã được cấp quyền
- không có ràng buộc theo sở hữu hoặc theo thợ đang làm

Đây là một điểm nhạy cảm về giới hạn quyền dữ liệu.

### 4.9. Tách service layer chưa rõ ràng

Không có service class cho module khách hàng như `CustomerService`, dù hệ thống đã có pattern `AuthService` và các service khác như `AIService`, `AnalyticsService` và `BookingService` trong [backend/app/services](backend/app/services).

Điều này làm module hiện tại lệch chuẩn kiến trúc:
- router dễ bị nặng
- business logic nằm tràn lan trong controller
- khó test đơn vị

### 4.10. Không có policy-level definition riêng cho module

Không có file/schema riêng mô tả rõ:
- ai nào được xem/ghi/sửa khách hàng
- ai nào được xem lịch sử dịch vụ của ai
- ai nào được cập nhật field nào
- khi nào phải audit log

Tức là RBAC đang là “quy tắc thủ công trong dependency”, chưa có “spec policy” rõ ràng.

## 5. Kết luận ngắn gọn

Module Quản lý Khách hàng hiện đang vận hành với luồng rõ ràng về mặt chức năng: login -> xác thực -> phân quyền -> CRUD customer -> thống kê và xem lịch sử. Tuy nhiên, cấu trúc hiện tại đang có các nhược điểm rõ ràng:
- RBAC logic bị lặp và khó bảo dưỡng
- route đang làm quá nhiều việc
- N+1 query trong danh sách khách hàng
- business logic chưa tách ra service layer
- quyền role đang chưa có policy rõ ràng theo scope dữ liệu

Nói cách khác, module về mặt chức năng đã “chạy được”, nhưng chưa đạt mức “được thiết kế theo RBAC và kiến trúc sạch” như một cấu trúc Spec-Driven Development cần có.
