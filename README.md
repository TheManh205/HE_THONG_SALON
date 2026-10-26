# 🌟 THE MANH SALON - HỆ THỐNG QUẢN LÝ ĐẶT LỊCH SALON TÓC TÍCH HỢP AI

Hệ thống quản lý đặt lịch và vận hành salon tóc cao cấp chuẩn **Clean Architecture & SOLID**, tích hợp **Google Gemini AI (`google-genai` SDK)** hỗ trợ tư vấn chất tóc, chat stylist thông minh, soạn tin nhắn chăm sóc khách hàng tự động, lưu trữ hồ sơ kỹ thuật hóa chất và nhật ký kiểm toán toàn diện.

---

## 👥 Thành Viên Nhóm & Phân Công Nhiệm Vụ

| Họ và tên | Mã sinh viên / Vai trò | Nhiệm vụ chính phụ trách |
| :--- | :--- | :--- |
| **Lương Việt Anh** | Backend & Database Lead | Thiết kế CSDL (13 bảng chuẩn hóa), xây dựng RESTful API FastAPI, thuật toán chống trùng lịch (Anti-Overlap), tích hợp nghiệp vụ thanh toán & hóa đơn, viết Unit Test Backend. |
| **Lương Thế Mạnh** | Frontend & AI Integration Lead | Thiết kế giao diện Frontend ReactJS (Dual Theme Light/Dark), tích hợp Google Gemini AI (Chat Stylist, CSKH, Tóm tắt lịch sử), xây dựng màn hình Public Booking & RBAC Users, tối ưu trải nghiệm UI/UX. |

---

## 📌 Các Điểm Nổi Bật Của Hệ Thống

- 🏷️ **Nhận Diện Thương Hiệu Đồng Bộ**: Tên thương hiệu **THE MANH SALON**, số Hotline `0988.888.888` hiển thị đồng bộ trên toàn bộ hóa đơn thanh toán, phiếu thu, trang chủ và cổng đặt lịch.
- ⏰ **Đồng Bộ Giờ Mở Cửa & Ca Làm Việc (07:00 - 23:00)**: Khung giờ hoạt động từ **7h sáng đến 11h đêm (07:00 - 23:00)** hàng ngày, tự động đồng bộ cho toàn bộ ca làm việc của Stylist và thuật toán sinh khung giờ trống (Available Slots).
- 🌓 **Chuyển Đổi Giao Diện Sáng / Tối (Dual Theme Light & Dark)**: Hỗ trợ chuyển đổi mượt mà giữa chế độ Sáng hiện đại và Tối sang trọng, tự động lưu vào `localStorage`. Các nút danh mục, bảng dữ liệu, ô tìm kiếm được tối ưu độ tương phản sắc nét.
- 🔐 **Bảo Mật & Phân Quyền RBAC (Role-Based Access Control)**:
  - Phân quyền chặt chẽ theo 3 vai trò: `admin`, `receptionist`, `hairdresser`.
  - Có trang quản trị riêng `/users` để Admin thêm/sửa/vô hiệu hóa tài khoản và phân quyền.
  - Bảo mật thông tin khách hàng: Tự động che số điện thoại trên modal xác nhận công khai (`093****566`).
- 🤖 **Trí Tuệ Nhân Tạo (Gemini AI) Đỉnh Cao & An Toàn**:
  - Không lộ API Key trên frontend; cấu hình tập trung qua `.env` ở Backend.
  - Chống ảo giác (Anti-Hallucination): Khóa chặt danh mục dịch vụ trong Database, nhiệt độ thấp `temperature = 0.2`.
  - Bộ khử khuẩn dữ liệu (Security Sanitizer): Tự động phát hiện và che giấu token, password, API key trước khi lưu log.
  - Tự động ghi nhật ký gọi AI (`ai_logs`): Đo lường thời gian phản hồi (latency), số lần thử lại (retry count), chi phí và độ an toàn.
- 🐳 **Đóng Gói Docker Trọn Gói**: Triển khai toàn bộ hệ thống (FastAPI, React/Nginx, Database) chỉ với 1 lệnh `docker compose up -d --build`.

---

## 🏛️ 1. Kiến Trúc & Công Nghệ

### Backend (FastAPI + SQLAlchemy + Pydantic v2 + Gemini AI)
- **Framework**: FastAPI (Python 3.11+)
- **ORM & Database**: SQLAlchemy 2.0 (Hỗ trợ SQLite và MySQL linh hoạt)
- **Validation & DTO**: Pydantic v2
- **Bảo mật**: JWT (JSON Web Token), Bcrypt Password Hashing, RBAC
- **AI Engine**: Google Gemini API (`google-genai` SDK), Prompt Engineering 3 lớp (System Instruction + Catalog Injection + Strict Output Schema)
- **Kiểm thử tự động**: Pytest (27 unit & integration test cases)
- **API Documentation**: Tự động sinh tài liệu OpenAPI / Swagger UI & ReDoc

### Frontend (ReactJS + Vite + TailwindCSS + Lucide Icons)
- **Công nghệ**: React 18, Vite 5, TailwindCSS 3, Lucide React Icons, Axios
- **Giao diện**: Dual Theme (Luxury Dark Theme & Clean Light Theme), Glassmorphism, Responsive 100% trên PC, Tablet và Mobile.
- **Routing**: React Router DOM v6 với phân quyền Protected Routes theo Role.
- **Quản lý trạng thái**: Context API (`AuthContext`, `ToastContext`).

---

## 📊 2. Cấu Trúc Cơ Sở Dữ Liệu (13 Bảng Chuẩn Hóa)

1. `roles`: Quản lý các vai trò người dùng trong hệ thống (`admin`, `receptionist`, `hairdresser`).
2. `users`: Tài khoản đăng nhập nội bộ của nhân viên salon (liên kết khóa ngoại tới `roles`).
3. `customers`: Hồ sơ khách hàng, số điện thoại, giới tính, lịch sử phục vụ.
4. `hairdressers`: Hồ sơ thợ tóc/stylist, đánh giá sao, tiểu sử, phân loại tay nghề, ảnh đại diện.
5. `schedules`: Ca làm việc hàng tuần theo các ngày trong tuần (Thứ 2 - Chủ Nhật, 07:00 - 23:00) và trạng thái ngày nghỉ (`is_day_off`).
6. `services`: Danh mục dịch vụ (Tên dịch vụ, giá niêm yết, thời lượng thực hiện, nhóm dịch vụ).
7. `appointments`: Lịch hẹn, thời gian bắt đầu & kết thúc, mã đặt hẹn (`booking_code`), trạng thái (`PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
8. `appointment_services`: Bảng trung gian liên kết nhiều dịch vụ trong cùng một lượt hẹn (Many-to-Many).
9. `invoices`: Hóa đơn dịch vụ, tổng tiền, giảm giá, số tiền thanh toán cuối cùng, trạng thái (`UNPAID`, `PAID`, `CANCELLED`).
10. `payments`: Lịch sử giao dịch thanh toán (`CASH`, `TRANSFER`), mã tham chiếu giao dịch.
11. `service_histories`: Nhật ký kỹ thuật làm tóc (công thức nhuộm, mã màu, nồng độ oxy, độ co giãn tóc, ghi chú kỹ thuật của thợ).
12. `audit_logs`: Nhật ký kiểm toán hệ thống (ghi nhận người thực hiện, hành động, bảng dữ liệu, IP, thời gian).
13. `ai_logs`: Nhật ký giám sát AI (chức năng AI, prompt đầu vào đã khử khuẩn, kết quả phản hồi, thời gian xử lý, mã trạng thái).

---

## 🚀 3. Hướng Dẫn Cài Đặt & Khởi Chạy

### Cách 1: Khởi Chạy Bằng Docker Compose (Khuyên dùng)

Hệ thống đã được đóng gói sẵn Docker cho cả Frontend và Backend:

```bash
# 1. Clone repository hoặc mở thư mục dự án
cd HETHONGSALON

# 2. Cấu hình biến môi trường trong file backend/.env:
# GEMINI_API_KEY="your_google_gemini_api_key_here"

# 3. Khởi chạy toàn bộ dịch vụ bằng Docker Compose
docker compose up -d --build
```

- **Giao diện Web Khách Hàng & Quản Trị**: [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Kiểm tra trạng thái (Health Check)**: [http://localhost:8000/health](http://localhost:8000/health)

---

### Cách 2: Khởi Chạy Thủ Công (Development Mode)

#### Bước 1: Khởi động Backend FastAPI
```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt thư viện phụ thuộc
pip install -r requirements.txt

# Tạo file .env và cấu hình GEMINI_API_KEY
# GEMINI_API_KEY="AIzaSy..."

# Khởi chạy server FastAPI (Tự động nạp bảng & dữ liệu mẫu ban đầu)
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### Bước 2: Khởi động Frontend ReactJS
```bash
# Mở terminal mới và di chuyển vào frontend
cd frontend

# Cài đặt các gói thư viện
npm install

# Khởi chạy Vite Dev Server
npm run dev
```
- Truy cập Giao diện Web: [http://localhost:5173](http://localhost:5173)

---

## 🧪 4. Kiểm Thử Tự Động (Automated Testing)

Toàn bộ hệ thống được bảo vệ bởi bộ kiểm thử tự động toàn diện với **27/27 test cases pass 100%**:

```bash
# Chạy bộ test tại thư mục backend
cd backend
pytest -v
```

**Các nhóm kiểm thử chính**:
- `test_auth.py`: Đăng nhập JWT, băm mật khẩu bcrypt, kiểm tra phân quyền truy cập RBAC.
- `test_booking_overlap.py`: Kiểm thử thuật toán chống trùng lịch của thợ, chặn đặt ngoài ca làm, gợi ý khung giờ thay thế.
- `test_services_invoices.py`: Tạo dịch vụ, sinh hóa đơn, thanh toán và chuyển trạng thái lịch hẹn.
- `test_ai.py` & `test_ai_service.py`: Tư vấn AI công khai, tạo tin nhắn chăm sóc, tóm tắt lịch sử kỹ thuật.
- `test_ai_logs.py`: Ghi nhận log AI vào database, đo lường độ trễ, kiểm thử bộ lọc khử khuẩn dữ liệu nhạy cảm.
- `test_e2e_flow.py`: Luồng nghiệp vụ toàn trình (End-to-End) từ Đặt lịch -> Hóa đơn -> Thanh toán -> AI tóm tắt công thức kỹ thuật.

---

## 🔑 5. Danh Sách Tài Khoản Thử Nghiệm

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn & Chức năng |
| :--- | :--- | :--- | :--- |
| **Quản Lý (Admin)** | `admin` | `admin123` | Toàn quyền: Doanh thu, quản lý tài khoản & phân quyền vai trò (/users), quản lý stylist, dịch vụ, nhật ký kiểm toán |
| **Lễ Tân (Receptionist)** | `letan` | `letan123` | Tiếp nhận lịch hẹn, đổi giờ hẹn, xuất hóa đơn, quản lý khách hàng, tạo tin nhắn CSKH AI |
| **Stylist (Thợ tóc)** | `stylist_nam` | `stylist123` | Xem ca làm việc cá nhân, tra cứu lịch sử kỹ thuật & lưu công thức thuốc uốn/nhuộm cho khách |
| **Stylist (Thợ tóc)** | `stylist_linh` | `stylist123` | Xem lịch hẹn cá nhân, chuyên gia nhuộm Balayage |
| **Khách Hàng (Public)** | *Không cần đăng nhập* | *Không cần* | Đặt lịch trực tuyến 24/7 tại đường dẫn `/booking` |

---

## 🛡️ 6. Thuật Toán Xếp Lịch & Chống Trùng Lịch (Anti-Overlap)

1. **Khung giờ mở cửa & ca làm việc**: Hoạt động từ **07:00 đến 23:00** tất cả các ngày trong tuần.
2. **Kiểm tra ca làm**: Xác định ca làm việc của stylist trong ngày (thời gian `start_time` và `end_time`), kiểm tra ngày nghỉ phép (`is_day_off`).
3. **Chống trùng lịch (Anti-Overlap)**: Khi đặt hẹn hoặc đổi giờ, hệ thống đối soát các cuộc hẹn hiện có của stylist:
   $$\max(T_{\text{bắt đầu}}, \text{Lịch}_{\text{bắt đầu}}) < \min(T_{\text{kết thúc}}, \text{Lịch}_{\text{kết thúc}})$$
4. **Sinh Slot Hẹn Tự Động**: Endpoint `/api/v1/appointments/available-slots` tự động tính toán và trả về toàn bộ khung giờ còn trống (bước nhảy 30 phút) phù hợp với tổng thời lượng các dịch vụ khách đã chọn.

---

## 🤖 7. Tính Năng Trí Tuệ Nhân Tạo (Gemini AI)

- **AI Chat Stylist Trực Tuyến**: Chatbox tư vấn tức thì ngay trên trang đặt lịch và trang AI Hub, hỗ trợ giải đáp thắc mắc về kiểu tóc phù hợp với khuôn mặt, màu nhuộm tôn da và ngân sách.
- **Tư Vấn & Khuyến Nghị Dịch Vụ**: Đề xuất dịch vụ chuẩn xác dựa trên chất tóc (khô, hư tổn, tẩy nhiều lần) và bảng giá thực tế của salon.
- **Tạo Tin Nhắn Chăm Sóc Khách Hàng**: Tự động sinh mẫu tin nhắn Zalo/SMS nhắc lịch hẹn, hướng dẫn gội sấy tại nhà sau khi làm hóa chất, hoặc tặng voucher tri ân.
- **Tóm Tắt Hồ Sơ Kỹ Thuật (History Summarizer)**: Trích xuất lịch sử làm tóc của khách để stylist nắm nhanh công thức màu và độ đàn hồi tóc trước khi thực hiện dịch vụ mới.
- **Chống Hallucination (Ảo giác AI)**: Khóa danh mục dịch vụ trong Database, nhiệt độ thấp (`temperature = 0.2`) đảm bảo thông tin luôn bám sát thực tế salon.
- **Giám Sát & Khử Khuẩn (AI Observability & Sanitizer)**: Mọi lượt gọi AI đều được ghi vết vào bảng `ai_logs` kèm độ trễ, số lần retry và được che tự động các dữ liệu bí mật/nhạy cảm.

---

## 📁 8. Cấu Trúc Thư Mục Dự Án

```
HETHONGSALON/
├── backend/
│   ├── app/
│   │   ├── core/           # Cấu hình config (.env), Database Engine, JWT & Security
│   │   ├── models/         # 13 Mô hình dữ liệu SQLAlchemy ORM
│   │   ├── schemas/        # Pydantic v2 DTOs & Validation
│   │   ├── services/       # Nghiệp vụ: Booking, Invoicing, Analytics, Gemini AI Service, Audit
│   │   ├── routers/        # Các API RESTful (Auth, Services, Appointments, Stylists, AI, Users,...)
│   │   ├── utils/          # Seeding dữ liệu khởi tạo ban đầu (seed.py)
│   │   └── main.py         # Entrypoint FastAPI ứng dụng
│   ├── tests/              # Bộ kiểm thử Pytest 27 test cases
│   ├── Dockerfile          # Dockerfile Backend (Python 3.11 Slim)
│   ├── requirements.txt    # Danh sách thư viện Python
│   └── pytest.ini
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Sidebar, Modals, AIChatbox, ThemeToggle,...
│   │   ├── contexts/       # AuthContext (Phân quyền RBAC), ToastContext
│   │   ├── pages/          # Booking, Login, Dashboard, Appointments, Stylists, Invoices, Users (RBAC), AI Hub,...
│   │   ├── services/       # Cấu hình gọi API Axios
│   │   ├── App.jsx         # Cấu hình Routes & Chuyển đổi giao diện Sáng/Tối
│   │   └── index.css       # Tailwind CSS & Design Tokens (Hỗ trợ Dark & Light mode)
│   ├── Dockerfile          # Dockerfile Frontend (Vite build + Nginx Alpine)
│   ├── nginx.conf          # Nginx Reverse Proxy & Routing SPA
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── docker-compose.yml      # Cấu hình khởi chạy trọn gói dịch vụ
├── README.md               # Tài liệu hướng dẫn sử dụng dự án
└── SPEC.md                 # Đặc tả kỹ thuật module
```

---

## 📞 Hỗ Trợ & Liên Hệ
- **Salon**: **THE MANH SALON**
- **Hotline**: `0988.888.888`
- **Thời gian phục vụ**: `07:00 - 23:00` hàng ngày (Thứ 2 - Chủ Nhật)
