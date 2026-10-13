# 🌟 THE MANH SALON - HỆ THỐNG QUẢN LÝ ĐẶT LỊCH SALON TÓC TÍCH HỢP AI

Hệ thống quản lý đặt lịch và vận hành salon tóc cao cấp chuẩn **Clean Architecture & SOLID**, tích hợp **Google Gemini AI (`google-genai` SDK)** hỗ trợ tư vấn chất tóc, chat stylist thông minh, soạn tin nhắn chăm sóc khách hàng và lưu trữ lịch sử kỹ thuật hóa chất.

---

## 📌 Điểm Nổi Bật Vừa Cập Nhật

- 🏷️ **Nhận Diện Thương Hiệu THE MANH SALON**: Đồng bộ tên thương hiệu **THE MANH**, số Hotline `0988.888.888` trên toàn bộ hệ thống hóa đơn, phiếu thu, trang chủ và trang đặt lịch.
- ⏰ **Đồng Bộ Giờ Mở Cửa & Ca Làm Việc (07:00 - 23:00)**: Khung giờ hoạt động từ **7h sáng đến 11h đêm (07:00 - 23:00)** hàng ngày, tự động đồng bộ cho toàn bộ ca làm việc của Stylist và thuật toán sinh slot đặt lịch thông minh.
- 🌓 **Chuyển Đổi Giao Diện Sáng / Tối (Light & Dark Theme)**: Nút bật/tắt Theme Sáng/Tối linh hoạt trên thanh điều hướng, tự động lưu lựa chọn vào `localStorage`. Tối ưu độ tương phản, chữ rõ nét, trải nghiệm thị giác cao cấp.
- 🔒 **Bảo Mật AI Tuyệt Đối**: Loại bỏ ô nhập API Key ở giao diện người dùng; toàn bộ cấu hình AI được bảo mật tập trung qua biến môi trường `GEMINI_API_KEY` trong file `.env` ở Backend.
- ⚡ **Tối Ưu Trợ Lý AI Chat Stylist**: Nâng cấp tốc độ phản hồi của Chatbot tư vấn, xử lý prompt song song và bảo vệ catalog dịch vụ, chống ảo giác (Anti-Hallucination).
- 🐳 **Hỗ Trợ Docker & Docker Compose**: Triển khai toàn bộ hệ sinh thái (Backend FastAPI, Frontend React/Nginx, Database) chỉ với 1 lệnh duy nhất.

---

## 🏛️ 1. Kiến Trúc & Công Nghệ

### Backend (FastAPI + SQLAlchemy + Pydantic v2 + Gemini AI)
- **Framework**: FastAPI (Python 3.11+)
- **ORM & Database**: SQLAlchemy 2.0 (Hỗ trợ SQLite và MySQL linh hoạt)
- **Validation & DTO**: Pydantic v2
- **Bảo mật**: JWT (JSON Web Token), Bcrypt Password Hashing, RBAC (Role-Based Access Control)
- **AI Engine**: Google Gemini API (`google-genai` SDK), prompt guarding khóa cứng catalog dịch vụ chống Hallucination
- **API Documentation**: Tự động sinh tài liệu OpenAPI / Swagger UI & ReDoc

### Frontend (ReactJS + Vite + TailwindCSS + Lucide Icons)
- **Công nghệ**: React 18, Vite 5, TailwindCSS 3, Lucide React Icons, Axios
- **Giao diện**: Dual Theme (Luxury Dark Theme & Clean Light Theme), Glassmorphism, Responsive 100% trên PC, Tablet và Mobile.
- **Routing**: React Router DOM v6 với phân quyền Protected Routes theo Role.

---

## 📊 2. Cấu Trúc Cơ Sở Dữ Liệu (11 Bảng)

1. `roles`: Quản lý vai trò người dùng (`admin`, `receptionist`, `hairdresser`).
2. `users`: Tài khoản đăng nhập nội bộ của nhân viên salon.
3. `customers`: Hồ sơ khách hàng, số điện thoại, lịch sử phục vụ.
4. `hairdressers`: Thông tin Stylist, đánh giá, tiểu sử, phân loại tay nghề.
5. `work_schedules`: Ca làm việc hàng tuần của từng thợ (Thứ 2 - Chủ Nhật, 07:00 - 23:00).
6. `daily_schedules`: Phân ca làm việc chi tiết theo từng ngày cụ thể trong tháng.
7. `services`: Danh mục dịch vụ (Tên, giá niêm yết, thời lượng, danh mục).
8. `appointments`: Lịch hẹn, thời gian bắt đầu & kết thúc, trạng thái (`PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
9. `appointment_services`: Liên kết nhiều dịch vụ trong cùng một lượt hẹn.
10. `invoices`: Hóa đơn thanh toán, chiết khấu, phương thức thanh toán (`CASH`, `TRANSFER`).
11. `service_histories`: Nhật ký kỹ thuật hóa chất (công thức nhuộm, mã màu, trục uốn, ghi chú thợ).

---

## 🚀 3. Hướng Dẫn Cài Đặt & Khởi Chạy

### Cách 1: Khởi Chạy Bằng Docker Compose (Khuyên dùng)

Hệ thống đã được đóng gói sẵn Docker cho cả Frontend và Backend:

```bash
# 1. Clone repository hoặc mở thư mục dự án
cd HETHONGSALON

# 2. Tạo file backend/.env và điền Gemini API Key:
# GEMINI_API_KEY="your_google_gemini_api_key_here"

# 3. Khởi chạy toàn bộ dịch vụ bằng Docker Compose
docker compose up -d --build
```

- **Giao diện Web (Frontend)**: [http://localhost:3000](http://localhost:3000)
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

# Khởi chạy server FastAPI (Tự động tạo bảng & nạp dữ liệu mẫu)
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### Bước 2: Khởi động Frontend ReactJS
```bash
# Mở một terminal mới và di chuyển vào frontend
cd frontend

# Cài đặt node modules
npm install

# Khởi chạy Vite Dev Server
npm run dev
```
- Truy cập Giao diện Web: [http://localhost:5173](http://localhost:5173)

---

## 🔑 4. Danh Sách Tài Khoản Thử Nghiệm

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn & Chức năng |
| :--- | :--- | :--- | :--- |
| **Quản Lý (Admin)** | `admin` | `admin123` | Toàn quyền: Xem doanh thu, phân ca làm việc, quản lý stylist, dịch vụ, tài khoản |
| **Lễ Tân (Receptionist)** | `letan` | `letan123` | Quản lý lịch hẹn, xếp lịch, in hóa đơn, quản lý khách hàng, soạn tin nhắn AI |
| **Stylist (Thợ tóc)** | `stylist_nam` | `stylist123` | Xem ca làm việc cá nhân, tra cứu lịch sử kỹ thuật & lưu công thức thuốc uốn/nhuộm |
| **Stylist (Thợ tóc)** | `stylist_linh` | `stylist123` | Xem lịch hẹn cá nhân, chuyên gia nhuộm Balayage |
| **Khách Hàng (Public)** | *Không cần đăng nhập* | *Không cần* | Đặt lịch trực tiếp tại đường dẫn `/booking` |

---

## 🛡️ 5. Thuật Toán Xếp Lịch & Chống Trùng Lịch (Anti-Overlap)

1. **Khung giờ mở cửa & ca làm việc**: Hệ thống hoạt động từ **07:00 đến 23:00**.
2. **Kiểm tra ca làm**: Xác định ca làm việc của stylist trong ngày (thời gian `start_time` và `end_time`), kiểm tra ngày nghỉ phép (`is_day_off`).
3. **Chống trùng lịch (Anti-Overlap)**: Khi đặt hẹn hoặc đổi giờ, hệ thống đối soát các cuộc hẹn hiện có của stylist:
   $$\max(T_{\text{bắt đầu}}, \text{Lịch}_{\text{bắt đầu}}) < \min(T_{\text{kết thúc}}, \text{Lịch}_{\text{kết thúc}})$$
4. **Sinh Slot Hẹn Tự Động**: Endpoint `/api/v1/appointments/available-slots` tự động tính toán và trả về toàn bộ khung giờ còn trống (bước nhảy 30 phút) phù hợp với tổng thời lượng các dịch vụ đã chọn.

---

## 🤖 6. Tính Năng Trí Tuệ Nhân Tạo (Gemini AI)

- **AI Chat Stylist Trực Tuyến**: Chatbox tư vấn tức thì ngay trên trang đặt lịch và trang AI Hub, hỗ trợ giải đáp thắc mắc về kiểu tóc phù hợp với khuôn mặt, màu nhuộm tôn da và ngân sách.
- **Tư Vấn & Khuyến Nghị Dịch Vụ**: Đề xuất dịch vụ chuẩn xác dựa trên chất tóc (khô, hư tổn, tẩy nhiều lần) và bảng giá thực tế của salon.
- **Tạo Tin Nhắn Chăm Sóc Khách Hàng**: Tự động sinh mẫu tin nhắn Zalo/SMS nhắc lịch hẹn, hướng dẫn gội sấy tại nhà sau khi làm hóa chất, hoặc tặng voucher tri ân.
- **Tóm Tắt Hồ Sơ Kỹ Thuật (History Summarizer)**: Trích xuất lịch sử làm tóc của khách để stylist nắm nhanh công thức màu và độ đàn hồi tóc trước khi thực hiện dịch vụ mới.
- **Chống Hallucination (Ảo giác AI)**: Khóa danh mục dịch vụ trong Database, nhiệt độ thấp (`temperature = 0.2`) đảm bảo thông tin luôn bám sát thực tế salon.

---

## 📁 7. Cấu Trúc Thư Mục Dự Án

```
HETHONGSALON/
├── backend/
│   ├── app/
│   │   ├── core/           # Cấu hình config (.env), Database Engine, JWT & Security
│   │   ├── models/         # 11 Mô hình dữ liệu SQLAlchemy ORM
│   │   ├── schemas/        # Pydantic v2 DTOs & Validation
│   │   ├── services/       # Nghiệp vụ: Booking, Invoicing, Analytics, Gemini AI Service
│   │   ├── routers/        # Các API RESTful (Auth, Services, Appointments, Stylists, AI,...)
│   │   ├── utils/          # Seeding dữ liệu khởi tạo ban đầu (seed.py)
│   │   └── main.py         # Entrypoint FastAPI ứng dụng
│   ├── tests/              # Bộ kiểm thử Pytest
│   ├── Dockerfile          # Dockerfile Backend (Python 3.11 Slim)
│   ├── requirements.txt    # Danh sách thư viện Python
│   └── pytest.ini
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Sidebar, Modals, AIChatbox, ThemeToggle,...
│   │   ├── contexts/       # AuthContext (Phân quyền RBAC), ToastContext
│   │   ├── pages/          # Booking, Login, Dashboard, Appointments, Stylists, Invoices, AI Hub,...
│   │   ├── services/       # Cấu hình gọi API Axios
│   │   ├── App.jsx         # Cấu hình Routes & Chuyển đổi giao diện Sáng/Tối
│   │   └── index.css       # Tailwind CSS & Design Tokens
│   ├── Dockerfile          # Dockerfile Frontend (Vite build + Nginx Alpine)
│   ├── nginx.conf          # Nginx Reverse Proxy & Routing SPA
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── docker-compose.yml      # File cấu hình chạy trọn gói dịch vụ
├── README.md               # Tài liệu hướng dẫn sử dụng dự án
└── .env.example            # Mẫu biến môi trường
```

---

## 📞 Hỗ Trợ & Liên Hệ
- **Salon**: **THE MANH SALON**
- **Hotline**: `0988.888.888`
- **Thời gian phục vụ**: `07:00 - 23:00` hàng ngày (Thứ 2 - Chủ Nhật)
