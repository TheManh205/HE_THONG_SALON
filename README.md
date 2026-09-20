# 🌟 LUMIÈRE SALON - HỆ THỐNG QUẢN LÝ ĐẶT LỊCH SALON TÓC TÍCH HỢP AI

Hệ thống quản lý salon tóc cao cấp chuẩn **Clean Code & SOLID Architecture**, tích hợp **Google Gemini AI (`google-genai` SDK)** hỗ trợ tư vấn chất tóc, tạo tin nhắn chăm sóc khách hàng và tóm tắt hồ sơ kỹ thuật màu/uốn.

---

## 🏛️ 1. Kiến Trúc & Công Nghệ

### Backend (FastAPI + SQLAlchemy + Pydantic v2 + Gemini AI)
- **Framework**: FastAPI (Python 3.12+)
- **ORM & Database**: SQLAlchemy 2.0 (Hỗ trợ MySQL và SQLite linh hoạt)
- **Validation**: Pydantic v2
- **Bảo mật**: JWT (JSON Web Token), Bcrypt Password Hashing, RBAC (Role-Based Access Control)
- **AI Engine**: Google Gemini API (`google-genai` SDK) với `temperature=0.2`, Prompt Guarding khóa cứng catalog dịch vụ chống Hallucination.
- **Testing**: Pytest (14/14 tests tự động đạt 100% pass)

### Frontend (ReactJS + Vite + TailwindCSS + Lucide Icons)
- **Công nghệ**: React 18, Vite 5, TailwindCSS 3, Lucide React Icons
- **Giao diện**: Chuẩn Luxury Salon Aesthetic, Glassmorphism cao cấp, Dark/Gold Modern Theme, Responsive 100%.

---

## 📊 2. Cấu Trúc Cơ Sở Dữ Liệu (11 Bảng)

1. `roles`: Quản lý vai trò người dùng (`admin`, `receptionist`, `hairdresser`).
2. `users`: Tài khoản đăng nhập nội bộ của nhân viên salon.
3. `customers`: Thông tin khách hàng, số điện thoại, ghi chú.
4. `hairdressers`: Hồ sơ thợ làm tóc, avatar, rating, bio.
5. `schedules`: Ca làm việc theo từng ngày trong tuần (Thứ 2 - CN) của từng thợ.
6. `services`: Danh mục dịch vụ (Tên, giá, thời lượng, phân loại).
7. `appointments`: Lịch hẹn, thời gian bắt đầu & kết thúc, trạng thái (`PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
8. `appointment_services`: Liên kết dịch vụ được chọn trong lịch hẹn.
9. `invoices`: Hóa đơn thanh toán, chiết khấu, phương thức thanh toán.
10. `service_histories`: Lịch sử kỹ thuật (công thức nhuộm/uốn, loại trục, ghi chú của thợ).
11. `audit_logs`: Nhật ký kiểm toán các thao tác quan trọng trên hệ thống.

---

## 🚀 3. Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Bước 1: Khởi động Backend FastAPI

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt các thư viện phụ thuộc
pip install -r requirements.txt

# (Tùy chọn) Điền Google Gemini API Key vào file .env
# GEMINI_API_KEY="AIzaSy..."

# Khởi động Backend server (Tự động tạo bảng & seed dữ liệu mẫu)
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Docs (Swagger UI): **http://127.0.0.1:8000/docs**
- Health Check: **http://127.0.0.1:8000/health**

### Bước 2: Chạy Kiểm Thử Pytest (Backend)

```bash
cd backend
pytest -v
```

### Bước 3: Khởi động Frontend ReactJS

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt node modules
npm install

# Chạy Development Server
npm run dev
```
- Truy cập Giao diện Web: **http://localhost:5173**

---

## 🔑 4. Danh Sách Tài Khoản Thử Nghiệm Mặc Định

Hệ thống đã tích hợp sẵn bộ chuyển đổi tài khoản 1-click (**Demo Switcher**) trên giao diện đăng nhập:

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn chính |
| :--- | :--- | :--- | :--- |
| **Quản Lý (Admin)** | `admin` | `admin123` | Toàn quyền: Thống kê doanh thu, quản lý stylist, dịch vụ, tài khoản |
| **Lễ Tân (Receptionist)** | `letan` | `letan123` | Tiếp nhận đặt lịch, đổi/hủy lịch, tạo hóa đơn, quản lý khách hàng |
| **Thợ Làm Tóc (Stylist)** | `stylist_nam` | `stylist123` | Xem ca làm việc cá nhân, lịch sử dịch vụ & công thức khách hàng |
| **Thợ Làm Tóc (Stylist)** | `stylist_linh` | `stylist123` | Chuyên gia nhuộm Balayage & tẩy tóc |
| **Khách Hàng (Public)** | *Không cần login* | *Không cần* | Đặt lịch trực tiếp tại đường dẫn `/booking` |

---

## 🛡️ 5. Thuật Toán Anti-Overlap Booking (Chống Trùng Lịch)

Khi đặt lịch hoặc đổi giờ hẹn:
1. **Kiểm tra ca làm việc**: Xác định ngày trong tuần của thợ, kiểm tra thợ có nghỉ làm (`is_day_off = True`) hoặc giờ hẹn có nằm ngoài ca (`start_time` - `end_time`).
2. **Kiểm tra trùng lịch**: Hệ thống quét các cuộc hẹn hiện có của thợ và bảo đảm không có giao nhau:
   $$\max(T_{\text{bắt đầu}}, \text{Lịch}_{\text{bắt đầu}}) < \min(T_{\text{kết thúc}}, \text{Lịch}_{\text{kết thúc}})$$
3. **Gợi ý slot tự động**: Nếu xảy ra xung đột, hệ thống tự động tính toán và trả về danh sách các khung giờ trống còn lại trong ngày.

---

## 🤖 6. Cơ Chế AI Engine (Google Gemini SDK `google-genai`)

- **Chống Hallucination**:
  - `temperature = 0.2` giúp phản hồi chuẩn xác, nhất quán.
  - System Prompt khóa cứng danh mục dịch vụ từ Database.
  - Backend Validator kiểm tra và lọc sạch bất kỳ dịch vụ nào không tồn tại trong DB trước khi trả về cho Frontend.
- **3 Module AI thông minh**:
  1. **Style & Service Advisor**: Phân tích chất tóc hư tổn, gợi ý combo dịch vụ và hướng dẫn chăm sóc tại nhà.
  2. **Automated Care Messaging**: Tự động soạn tin nhắn Zalo/SMS nhắc hẹn, hướng dẫn sau làm tóc và voucher tri ân.
  3. **Customer History Summarizer**: Tóm tắt nhanh hồ sơ kỹ thuật, công thức màu, trục uốn và thợ quen thuộc.

---

## 📁 7. Cấu Trúc Dự Án Chi Tiết

```
HETHONGSALON/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, Database Engine, Security JWT/Bcrypt
│   │   ├── models/         # 11 Thực thể SQLAlchemy ORM
│   │   ├── schemas/        # Pydantic v2 DTOs & Validation
│   │   ├── services/       # Anti-overlap Booking, Invoice, Analytics, AI Engine
│   │   ├── routers/        # 9 Endpoints API RESTful
│   │   ├── utils/          # Seed data generator
│   │   └── main.py         # FastAPI Entrypoint
│   ├── tests/              # Pytest Unit & Integration tests
│   ├── requirements.txt
│   └── pytest.ini
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Sidebar, Modal, Badges
│   │   ├── contexts/       # AuthContext (RBAC), ToastContext
│   │   ├── pages/          # Public Booking, Login, Dashboard, Appointments, Customers, Stylists, Services, Invoices, Analytics, AI Hub
│   │   ├── services/       # Axios client & API endpoints
│   │   ├── App.jsx         # Routing & Protected Routes
│   │   └── index.css       # Tailwind & Luxury Theme Tokens
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── README.md
└── .env.example
```
