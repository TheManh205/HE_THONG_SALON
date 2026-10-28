# 💈 HỆ THỐNG QUẢN LÝ ĐẶT LỊCH SALON TÓC CÓ TÍCH HỢP AI
### 🌟 SALON HAIR SMART APPOINTMENT & DUAL-ENGINE AI ASSISTANT PLATFORM

> **Đồ án Học phần:** Ứng dụng Trí tuệ Nhân tạo — **Đề tài số 39**  
> **Đơn vị đào tạo:** Khoa Công nghệ Thông tin — Trường Đại học Công nghệ Thông tin & Truyền thông (ICTU) — Lớp CNTT K23B  
> **Giảng viên hướng dẫn:** TS. NGUYỄN ĐÌNH DŨNG  

---

## 👥 1. THÀNH VIÊN THỰC HIỆN & PHÂN CÔNG TRÁCH NHIỆM

*(Trích xuất chuẩn xác theo **Bảng 9.2: Bảng Phân chia Trách nhiệm & Đóng góp Cá nhân của Từng Thành viên** trong Báo cáo Nghiệm thu đồ án)*

| Họ và Tên Sinh viên | Mã Sinh viên | Vai trò Phân công | Hạng mục Công việc Thực hiện Chính | Tỷ lệ Đóng góp |
| :--- | :--- | :--- | :--- | :---: |
| **Lương Việt Anh** | **DTC245200063** | **Trưởng nhóm**<br>Frontend & UI/UX Lead | &bull; Thiết kế toàn bộ giao diện React SPA 8 màn hình chức năng (Tailwind CSS/Vite).<br>&bull; Xây dựng trải nghiệm người dùng UI/UX, tối ưu hóa điểm chạm tương tác AI.<br>&bull; Kiểm thử chức năng giao diện, tích hợp API Axios với hệ thống Backend.<br>&bull; Chuẩn hóa tài liệu báo cáo, kịch bản thuyết trình và slide bảo vệ. | **50.0%**<br>*(Hoàn thành xuất sắc)* |
| **Lương Thế Mạnh** | **DTC245200547** | **Thành viên**<br>Backend, AI & Database Lead | &bull; Thiết kế kiến trúc Backend FastAPI, ORM CSDL 10 bảng chuẩn 3NF.<br>&bull; Hiện thực thuật toán kiểm tra xung đột thời gian & khóa slot thợ (&lt; 0.1s).<br>&bull; Tích hợp Google Gemini AI SDK, kỹ thuật Catalog Grounding & Local Fallback Engine.<br>&bull; Xây dựng và thực thi trọn vẹn bộ kiểm thử tự động Pytest. | **50.0%**<br>*(Hoàn thành xuất sắc)* |

---

## 🎯 2. TỔNG QUAN & 05 ĐIỂM ĐAU THỰC TẾ (PAIN POINTS) ĐƯỢC GIẢI QUYẾT

Dựa trên kết quả khảo sát thực địa tại các cơ sở salon tóc (N = 85 khách hàng & 12 thợ làm tóc), hệ thống giải quyết triệt để 5 điểm đau vận hành:

1. **PP01: Trùng lịch & Chờ đợi lâu (78.8%)** $\rightarrow$ Giải quyết bằng **Thuật toán Khóa Khung Giờ (Anti-Overlap Booking Engine)** với độ trễ &lt; 0.1s, loại bỏ 100% tình trạng chồng chéo lịch hẹn.
2. **PP02: Tư vấn sai chất tóc & Nguy cơ cháy tóc (81.2%)** $\rightarrow$ Giải quyết bằng **AI Catalog Grounding Advisor** kết hợp tra cứu hồ sơ tiền sử kỹ thuật hóa chất (`service_histories`).
3. **PP03: Quá tải thợ & Lệch ca làm việc** $\rightarrow$ Quản lý ca trực theo tuần (`work_schedules`), kiểm soát ngày nghỉ và phân bổ công việc công bằng.
4. **PP04: Hạch toán thủ công & Sai hóa đơn (72.9%)** $\rightarrow$ Tự động lập hóa đơn từ lịch hoàn tất, tính toán số học chính xác cao (Decimal), hỗ trợ chiết khấu và ghi nhận lịch sử liên hoàn.
5. **PP05: Khách quên lịch hẹn (68.2%)** $\rightarrow$ **AI Personalized Reminder Generator** tự động soạn tin nhắn Zalo/SMS lịch sự, cá nhân hóa theo từng khách hàng.

---

## 🤖 3. TRỌNG TÂM CÔNG NGHỆ TRÍ TUỆ NHÂN TẠO (AI HIGHLIGHTS)

Hệ thống được thiết kế theo chuẩn Kỹ thuật AI chuyên nghiệp, không sử dụng API mở đơn giản mà áp dụng kiến trúc khép kín 4 bước:

```
[Khách / Lễ tân] 
      │
      ▼ (Yêu cầu tư vấn)
[Backend FastAPI] ──► Fetch DB Catalog (is_active=1) & Service History
      │
      ▼ (Prompt Packaging + Negative Constraints + JSON Schema + temp=0.2)
[Dual-Engine Coordinator]
   ├──► [Nhánh 1: Google Gemini 2.5 Flash SDK] (Cloud API, latency ~1.18s)
   └──► [Nhánh 2: Rule-based Fallback Engine] (In-memory < 1ms khi mất mạng / 429 Quota / Timeout)
      │
      ▼ (Backend JSON Verification & Sanitize Sensitive Data)
[AILog Audit] ──► [Frontend Client Response]
```

### 3.1. Kỹ thuật Catalog Grounding & Chống Ảo giác (Anti-Hallucination)
- **Bơm dữ liệu CSDL vào System Instruction:** AI chỉ được phép gợi ý các dịch vụ đang có trạng thái `is_active = True` trong cơ sở dữ liệu salon.
- **Ràng buộc Phủ định (Negative Constraints):** Nghiêm cấm bịa đặt các dịch vụ ngoài danh mục (ví dụ khách hỏi "gói cấy tóc Nano" $\rightarrow$ AI từ chối lịch sự và hướng sang dịch vụ phục hồi Keratin có sẵn).
- **Ép kiểu JSON Schema:** Cấu hình `response_mime_type="application/json"` với `temperature=0.2` giúp cấu trúc dữ liệu phản hồi luôn đạt chuẩn 100%.

### 3.2. Bộ Máy Dự Phòng Kép (Dual-Engine High-Availability Fallback)
- Tự động kích hoạt **Local Rule-based Matcher** chạy trực tiếp trong bộ nhớ máy chủ (&lt; 1ms) khi xảy ra lỗi mạng (`ConnectionError`), cạn Quota (`HTTP 429`), hoặc Timeout (&gt; 10s).
- Hệ thống đảm bảo **Crash-Free 100%**, người dùng không bao giờ gặp lỗi gián đoạn dịch vụ.

### 3.3. Thực nghiệm Đối sánh 3 Thế hệ Prompt Engineering (N = 12 Mẫu thử)
- **Thế hệ 1 (v1 - Zero-shot):** Tỷ lệ ảo giác 25.0%, định dạng đúng 41.7%, thời gian 1.85s.
- **Thế hệ 2 (v2 - Constrained Text):** Tỷ lệ ảo giác 8.3%, định dạng đúng 83.3%, thời gian 1.42s.
- **Thế hệ 3 (v3 - Structured Guardrails - Chính thức):** Tỷ lệ ảo giác **0.0%**, định dạng đúng chuẩn **100.0%**, thời gian xử lý **1.18s**.

### 3.4. Đạo Đức AI & An Toàn Riêng Tư (Privacy-by-Design)
- Không gửi số điện thoại hay thông tin định danh cá nhân của khách lên Gemini API.
- Tự động lọc và che giấu (masking) token, password, API key trước khi lưu vết vào bảng `ai_logs`.
- AI hoạt động ở vai trò trợ lý (Stateless Helper, Human-in-the-loop); quyền quyết định đặt lịch và xuất hóa đơn luôn thuộc về con người.

---

## 🏛️ 4. KIẾN TRÚC HỆ THỐNG & CƠ SỞ DỮ LIỆU

### 4.1. Ngăn Xếp Công Nghệ (Tech Stack)
- **Backend API:** Python 3.12 / 3.13, FastAPI (Asynchronous), Pydantic v2 schemas, SQLAlchemy 2.0 ORM.
- **Bảo Mật:** Mã hóa mật khẩu Bcrypt (12 salt rounds), Access Token JWT 24h, Ma trận phân quyền 3 vai trò (Manager, Receptionist, Hairdresser).
- **Frontend SPA:** React 18, Vite 5, Tailwind CSS, Lucide React Icons, Context API (`AuthContext`, `ToastContext`), Axios Client.
- **Cơ Sở Dữ Liệu:** SQLite 3 (cho phát triển & demo cục bộ với cơ chế File-level Lock retry 10s); Tương thích hoàn toàn MySQL 8.0 InnoDB qua biến môi trường `DATABASE_URL`.
- **Trí Tuệ Nhân Tạo:** Google GenAI SDK v1 (`gemini-2.5-flash` / `gemini-1.5-flash`) + In-Memory Rule Fallback Engine.
- **Kiểm Thử Tự Động:** Pytest 9.1.1, Pytest-cov (Kiểm thử đơn vị, kiểm thử tích hợp ca sử dụng, ca biên và ngoại lệ AI).

### 4.2. Cơ Sở Dữ Liệu 10 Bảng Chuẩn Hóa 3NF
1. **`users`**: Tài khoản nhân viên nội bộ (`admin`, `receptionist`, `hairdresser`).
2. **`customers`**: Hồ sơ khách hàng, số điện thoại, tên, ghi chú đặc điểm chất tóc.
3. **`hairdressers`**: Hồ sơ thợ làm tóc, chuyên môn kỹ thuật, liên kết tài khoản user.
4. **`services`**: Danh mục dịch vụ, thời lượng thực hiện (phút), đơn giá niêm yết, phân nhóm.
5. **`work_schedules`**: Ca làm việc theo ngày trong tuần của thợ và đánh dấu ngày nghỉ (`is_day_off`).
6. **`appointments`**: Lịch hẹn, thời gian bắt đầu, thời gian kết thúc, mã đặt hẹn, trạng thái (`PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
7. **`appointment_services` / `invoice_details`**: Bảng chi tiết liên kết nhiều dịch vụ cho mỗi lượt đặt lịch.
8. **`invoices`**: Hóa đơn thanh toán tài chính, tổng tiền, chiết khấu, phương thức thanh toán, trạng thái (`UNPAID`, `PAID`, `CANCELLED`).
9. **`service_histories`**: Nhật ký kỹ thuật chăm sóc tóc (công thức màu nhuộm, nồng độ oxy, thời gian hấp/uốn, ghi chú thợ).
10. **`ai_logs`**: Nhật ký kiểm toán toàn vẹn mọi tương tác AI (prompt đã khử khuẩn, response JSON, thời gian xử lý ms, trạng thái).

*(Hệ thống có hỗ trợ thêm bảng mở rộng `payments` và `audit_logs` phục vụ kiểm toán giao dịch đa cổng).*

---

## 🖥️ 5. PHÂN HỆ MÀN HÌNH GIAO DIỆN (REACT SPA)

Ứng dụng React SPA được thiết kế theo phong cách **Luxury Dark & Gold Theme** sang trọng, responsive trên máy tính và thiết bị di động:

- **Cổng Đặt Lịch Công Khai (`/booking`)**: Khách hàng vãng lai không cần đăng nhập; nhập SĐT để nhận diện hồ sơ cũ; nhờ AI tư vấn gói dịch vụ tóc; chọn stylist và khung giờ rảnh; nhận mã đặt lịch tức thì.
- **Đăng Nhập Nghiệp Vụ (`/login`)**: Xác thực tài khoản nhân viên, cấp JWT token và tự động phân luồng theo vai trò RBAC.
- **Bảng Điều Khiển Tổng Quan (`/`)**: Báo cáo KPIs doanh thu, lịch hẹn trong ngày, ca trực thợ.
- **Quản Lý Lịch Hẹn (`/appointments`)**: Calendar Timeline trực quan theo thợ; đặt lịch hộ tại quầy; đổi giờ hẹn; nút kích hoạt AI sinh tin nhắn nhắc lịch.
- **Hồ Sơ Khách Hàng (`/customers`)**: Quản lý danh bạ khách, tiền sử tóc, công thức thuốc qua từng lần làm dịch vụ.
- **Thợ & Ca Trực (`/stylists`)**: Thiết lập ca làm việc trong tuần, quản lý ngày nghỉ phép của thợ.
- **Danh Mục Dịch Vụ (`/services`)**: Niêm yết giá, thời lượng thực hiện, đồng bộ tức thời vào AI Catalog Grounding.
- **Hóa Đơn & Thanh Toán (`/invoices`)**: Xuất hóa đơn từ lịch hẹn, trừ giảm giá, thanh toán hoàn tất và tự động sao chép kỹ thuật vào lịch sử khách.
- **AI Hub (`/ai-hub`)**: Không gian tương tác AI tập trung (Tư vấn gói dịch vụ, Soạn tin nhắn Zalo, Tóm tắt hồ sơ kỹ thuật, Chatbot trực tiếp).
- **Báo Cáo Nâng Cao & Quản Trị (`/analytics`, `/users`)**: Biểu đồ phân tích doanh thu & hiệu suất thợ; phân quyền người dùng nội bộ.

---

## 🚀 6. HƯỚNG DẪN CÀI ĐẶT & VẬN HÀNH HỆ THỐNG

### Cách 1: Khởi Chạy Bằng Docker Compose (Triển khai nhanh)
```bash
# 1. Mở thư mục gốc dự án
cd HETHONGSALON

# 2. Cấu hình khóa API trong backend/.env
# GEMINI_API_KEY="AIzaSy..."

# 3. Khởi chạy toàn bộ hệ thống
docker compose up -d --build
```
- **Web App**: [http://localhost:3000](http://localhost:3000) (hoặc [http://localhost:5173](http://localhost:5173))
- **Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Cách 2: Khởi Chạy Thủ Công Trên Môi Trường Cục Bộ

#### Bước 1: Khởi động Backend API (FastAPI)
```bash
# Chuyển vào thư mục backend
cd backend

# Cài đặt các thư viện phụ thuộc
pip install -r requirements.txt

# Tạo file .env và cấu hình GEMINI_API_KEY
# Khởi tạo bảng cơ sở dữ liệu và nạp dữ liệu mẫu ban đầu (Seed Data):
python -m app.utils.seed

# Khởi chạy server FastAPI
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- **Tài liệu API Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Kiểm tra trạng thái hệ thống**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

#### Bước 2: Khởi động Frontend Client (React Vite)
```bash
# Mở một cửa sổ dòng lệnh mới và chuyển vào frontend
cd frontend

# Cài đặt các gói npm phụ thuộc
npm install

# Khởi chạy Vite Dev Server
npm run dev
```
- **Truy cập ứng dụng**: [http://localhost:5173](http://localhost:5173)

---

## 🧪 7. KIỂM THỬ TỰ ĐỘNG (AUTOMATED TESTING)

Hệ thống sở hữu bộ kiểm thử tự động toàn diện được viết bằng **Pytest**, kiểm chứng 100% tính đúng đắn của logic nghiệp vụ, ma trận phân quyền và khả năng chịu lỗi AI:

```bash
# Chạy toàn bộ kiểm thử tự động
cd backend
pytest -v
```

### Các nhóm kiểm thử cốt lõi:
- **`test_auth.py`**: Xác thực đăng nhập Bcrypt, cấp token JWT, kiểm tra phân quyền RBAC (403 Forbidden).
- **`test_booking_overlap.py`**: Kiểm thử thuật toán chống trùng lịch thợ, ca hẹn ngoài ca trực, ca hẹn giáp ranh hợp lệ.
- **`test_services_invoices.py`**: Quản lý dịch vụ, tính toán hóa đơn Decimal, chuyển trạng thái `PAID` và cập nhật lịch sử.
- **`test_ai_service.py` & `test_ai.py`**: Kiểm chứng cơ chế Catalog Grounding chống ảo giác, tạo tin nhắn nhắc lịch, tóm tắt tiền sử tóc.
- **`test_ai_logs.py`**: Kiểm toán nhật ký AI, đo lường thời gian phản hồi, kiểm tra bộ lọc khử khuẩn dữ liệu nhạy cảm.
- **`test_e2e_flow.py`**: Luồng nghiệp vụ toàn trình (End-to-End) từ Đặt lịch $\rightarrow$ Hoàn tất $\rightarrow$ Xuất hóa đơn $\rightarrow$ AI đọc lịch sử.

---

## 🔑 8. DANH SÁCH TÀI KHOẢN MẪU ĐỂ TEST & DEMO

| Vai trò | Tên đăng nhập | Mật khẩu | Phạm vi Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản Lý (Manager)** | `admin` | `admin123` | Toàn quyền quản trị hệ thống, bảng giá, doanh thu, phân quyền tài khoản `/users` |
| **Lễ Tân (Receptionist)** | `letan` | `letan123` | Quản lý lịch hẹn, điều phối thợ, kích hoạt AI nhắc lịch, lập hóa đơn thanh toán |
| **Thợ Tóc (Hairdresser)** | `stylist_nam` | `stylist123` | Xem ca trực cá nhân, kích hoạt AI tóm tắt tiền sử tóc của khách phụ trách |
| **Thợ Tóc (Hairdresser)** | `stylist_linh` | `stylist123` | Xem lịch làm việc cá nhân, chuyên gia nhuộm Balayage |
| **Khách Hàng (Public)** | *(Vãng lai)* | *(Không cần)* | Tự đặt lịch trực tuyến và nhờ AI tư vấn kiểu tóc tại `/booking` |

---

## 🎬 9. KỊCH BẢN TRÌNH DIỄN TRỰC TIẾP (LIVE DEMO SCRIPT 8-10 PHÚT)

*(Được chuẩn hóa theo Mục 8.3 trong Báo cáo nghiệm thu và Slide thuyết trình Đề tài số 39)*

1. **Bước 1 (0:00 - 1:30 | Lương Việt Anh):** Khách hàng vào `/booking`, SĐT `0912345678`, bấm "AI Tư Vấn": *"Tóc tôi vừa tẩy xơ quá..."* $\rightarrow$ AI gợi ý đúng Phục hồi Keratin + Cắt tỉa. Đặt lịch lúc 09:30 thành công.
2. **Bước 2 (1:30 - 2:30 | Lương Thế Mạnh):** Thử đặt tiếp lịch khác cho cùng thợ lúc 09:45 $\rightarrow$ **Hệ thống báo lỗi xung đột 409 Conflict**. Chứng minh thuật toán khóa slot thời gian thực.
3. **Bước 3 (2:30 - 4:00 | Lương Việt Anh):** Đăng nhập Lễ tân (`letan`), bấm **"AI Soạn tin nhắn nhắc lịch"** $\rightarrow$ Sinh tin nhắn Zalo cá nhân hóa cực chuẩn. Thao tác dời lịch sang 14:00.
4. **Bước 4 (4:00 - 5:15 | Lương Việt Anh):** Đăng nhập Thợ làm tóc (`stylist_nam`), bấm **"AI Tóm tắt hồ sơ khách"** $\rightarrow$ Hiển thị 3 gạch đầu dòng tiền sử tóc trong &lt; 3 giây.
5. **Bước 5 (5:15 - 6:30 | Lương Việt Anh):** Lễ tân xuất hóa đơn cho lịch hoàn tất, áp dụng giảm giá, đổi trạng thái `PAID` $\rightarrow$ Tự động lưu công thức hóa chất vào `service_histories`.
6. **Bước 6 (6:30 - 7:45 | Lương Thế Mạnh):** Thử nghiệm bảo mật: Thợ tóc cố tình vào trang Hóa đơn $\rightarrow$ Chặn quyền **403 Forbidden**. Quản lý xem Dashboard doanh thu cập nhật tức thời.
7. **Bước 7 (7:45 - 9:00 | Lương Thế Mạnh - ĐIỂM NHẤN KỸ THUẬT):** Cố tình đổi sai `GEMINI_API_KEY` trong file `.env`. Bấm AI tư vấn $\rightarrow$ **Rule-based Fallback Engine kích hoạt ngay trong &lt; 1ms**, hệ thống Crash-free HTTP 200!

---

## 📊 10. KHẢO SÁT ĐỘ HÀI LÒNG NGƯỜI DÙNG (CSAT)

Đồ án tiến hành khảo sát thực nghiệm theo thang đo Likert 5 mức độ và đạt điểm trung bình xuất sắc **4.7 / 5.0**:
- **Giao diện trực quan, thẩm mỹ Luxury:** `4.6 / 5.0`
- **Tốc độ đặt lịch & Khóa slot chính xác:** `4.8 / 5.0`
- **Chất lượng Trợ lý AI tư vấn chất tóc:** `4.5 / 5.0`
- **AI Soạn tin nhắc lịch & Tóm tắt lịch sử:** `4.7 / 5.0`
- **Minh bạch hóa đơn & Hạch toán tài chính:** `4.9 / 5.0`

---

## 📂 11. TÀI LIỆU & TỆP TIN ĐÍNH KÈM
- **Báo cáo nghiệm thu hoàn chỉnh**: [`docs/BaoCao_SALON (3).docx`](./docs/BaoCao_SALON%20(3).docx)
- **Slide thuyết trình bảo vệ (File PDF in/chiếu)**: [`docs/Slide_ThuyetTrinh_DeTai39.pdf`](./docs/Slide_ThuyetTrinh_DeTai39.pdf) *(Khuyên dùng)*
- **Slide thuyết trình bảo vệ (File HTML tương tác)**: [`docs/Slide_ThuyetTrinh_DeTai39.html`](./docs/Slide_ThuyetTrinh_DeTai39.html)
- **Đặc tả kỹ thuật chi tiết**: [`SPEC.md`](./SPEC.md)

---
*© 2026 Nhóm 39 — Khoa Công nghệ Thông tin, Trường Đại học Công nghệ Thông tin & Truyền thông (ICTU)*
