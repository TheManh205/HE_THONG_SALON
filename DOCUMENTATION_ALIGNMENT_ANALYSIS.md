# DOCUMENTATION ALIGNMENT ANALYSIS

## 1. Executive Summary
This document analyzes the required changes to project documentation (`SPEC.md` and `BaoCaoMoi (1).docx`) to accurately reflect the finalized architectural decisions (DECISION-001 and DECISION-002) implemented in the `HE_THONG_SALON` repository. The architecture correctly retains the `roles` table for RBAC, uses `payments` for transaction logging, and relies on `appointment_services` for invoice line items. This analysis ensures the specifications serve as an accurate "Source of Truth" for the actual codebase without requiring any further modifications to the source code.

## 2. SPEC.md Findings
`SPEC.md` generally describes the data flow well but lacks references to the `payments` model and the normalized `roles` structure. 

**Occurrences found:**
- **Section 2.7 (Dữ liệu nền của module)**:
  - Mentions `user.py: thông tin người dùng + role` but doesn't mention the `roles` table explicitly.
  - Mentions `invoice.py: hóa đơn và trạng thái thanh toán` but entirely omits `payment.py` and `service.py` (which contains `appointment_services`).
- **Section 2.1 (Xác thực và phân quyền)**:
  - States the token contains `role: role name`. This perfectly matches the current implementation (DECISION-001) where the API exposes a flat string.

## 3. BaoCaoMoi Findings
Based on the gap analysis and previous audits, `BaoCaoMoi (1).docx` contains deprecated architectural designs:
- **USERS table**: Described as having a `role` VARCHAR column.
- **INVOICE_DETAILS table**: Described as a distinct entity for billing line items.
- **PAYMENTS table**: Missing from the original design.
- **ERD/Class Diagram**: Visualizes the aforementioned deprecated structures.

## 4. Actual Architecture

### A. RBAC
- **Current architecture**: `users` table → `role_id` (Foreign Key) → `roles` table.
- **API representation**: Exposes a flat string (e.g., `UserResponse.role = "admin"`).

### B. BILLING/PAYMENT
- **Current architecture**: 
  - `appointments` → `appointment_services` (stores `price_at_booking`, acting as line items).
  - `invoices` (header summarizing total/discount).
  - `payments` (transaction attempts, methods, and timestamps).
- **Invoice Line Items**: Explicitly handled by `appointment_services`. No physical `invoice_details` table exists or is required.

## 5. Alignment Matrix

| Document | Section | Current Statement | Actual Implementation | Required Change | Priority |
|----------|---------|-------------------|-----------------------|-----------------|----------|
| `SPEC.md` | 2.7 Dữ liệu nền | Liệt kê models thiếu `payment.py` và `service.py` | Có sử dụng `payments` và `appointment_services` | Bổ sung danh sách models | REQUIRED |
| `BaoCaoMoi` | Database Schema | `USERS` có trường `role` (VARCHAR) | `users` dùng `role_id` FK đến bảng `roles` | Sửa mô tả schema Users | REQUIRED |
| `BaoCaoMoi` | Database Schema | Có bảng `INVOICE_DETAILS` | Dùng `appointment_services` thay thế | Sửa mô tả schema | REQUIRED |
| `BaoCaoMoi` | Database Schema | Không có bảng quản lý thanh toán | Có bảng `payments` quản lý giao dịch | Bổ sung bảng `PAYMENTS` | REQUIRED |
| `BaoCaoMoi` | ERD / Diagrams | Vẽ `USERS.role` và `INVOICE_DETAILS` | Khác biệt cấu trúc SQL thực tế | Cập nhật hình vẽ ERD | RECOMMENDED |

## 6. Exact Edit Plan

### REQUIRED CHANGES

#### Edit 1: `SPEC.md` (Section 2.7)
- **Current wording**: 
  ```markdown
  - backend/app/models/invoice.py: hóa đơn và trạng thái thanh toán
  - backend/app/models/user.py: thông tin người dùng + role
  
  Mối quan hệ đang có:
  - user -> role
  - customer -> invoices
  ```
- **Proposed wording**: 
  ```markdown
  - backend/app/models/invoice.py: hóa đơn (Invoice header)
  - backend/app/models/payment.py: lịch sử giao dịch thanh toán
  - backend/app/models/service.py: quản lý dịch vụ và appointment_services (đóng vai trò chi tiết hóa đơn)
  - backend/app/models/user.py: thông tin người dùng (liên kết với bảng roles)
  
  Mối quan hệ đang có:
  - user -> role_id -> roles
  - appointment -> appointment_services -> invoice
  - invoice -> payments
  ```
- **Reason**: Accurately maps the implemented billing and RBAC models.
- **Diagram impact**: None.
- **Schema impact**: None.

#### Edit 2: `BaoCaoMoi (1).docx` (Database Schema - ROLES)
- **Current description**: Bảng `USERS` chứa trường `role` (VARCHAR) để phân quyền.
- **Proposed wording**: "Bảng `USERS` liên kết với bảng `ROLES` qua khóa ngoại `role_id` để chuẩn hóa phân quyền (Normalized RBAC)."
- **Reason**: Reflects DECISION-001 (keeping the roles table).
- **Diagram impact**: Update ERD.
- **Schema impact**: Update Data Dictionary table.

#### Edit 3: `BaoCaoMoi (1).docx` (Database Schema - INVOICE_DETAILS & PAYMENTS)
- **Current description**: Có bảng `INVOICE_DETAILS` lưu chi tiết dịch vụ. Không có bảng thanh toán riêng.
- **Proposed wording**: "Bảng `APPOINTMENT_SERVICES` lưu các dịch vụ được chọn trong lịch hẹn cùng giá tại thời điểm đặt (`price_at_booking`), vì vậy trong kiến trúc hiện tại nó cung cấp dữ liệu dòng chi tiết dịch vụ dùng cho hóa đơn. Bảng `PAYMENTS` chịu trách nhiệm ghi nhận các giao dịch thanh toán (trạng thái, phương thức, mã tham chiếu)."
- **Reason**: Standardizes terminology and reflects DECISION-002 accurately.
- **Diagram impact**: Update ERD.
- **Schema impact**: Replace `INVOICE_DETAILS` with `PAYMENTS` in Data Dictionary.

## 7. Diagram Impact
The following diagrams in `BaoCaoMoi (1).docx` MUST be updated by the documentation owner:
- **ERD (Entity-Relationship Diagram)**: 
  - Add `ROLES` table (1:N with `USERS`).
  - Remove `INVOICE_DETAILS`.
  - Add `PAYMENTS` table (N:1 with `INVOICES`).
- **Class Diagram**: Align entity classes with the ERD changes.

## 8. Terminology Standardization
To maintain consistency across all documentation and codebase, the following formal terminology must be used:
- **Role Source of Truth**: Bảng `roles` (Database) / Thuộc tính `role` dạng chuỗi phẳng (API Response).
- **Invoice Line Items**: Bảng `appointment_services` (Cung cấp chi tiết dịch vụ và giá).
- **Payment Transaction**: Bảng `payments` (Quản lý giao dịch).

## 9. Risks of Documentation Changes
- Mismatched versions if the Word document is distributed without updating the diagrams.
- Non-technical stakeholders might be confused by the removal of `INVOICE_DETAILS` if the role of `appointment_services` is not clearly explained in the text.

## 10. Validation Checklist
- [ ] `SPEC.md` Section 2.7 updated with `payment.py`, `service.py`, and `roles`.
- [ ] `BaoCaoMoi` ERD redrawn to show `ROLES` and `PAYMENTS`.
- [ ] `BaoCaoMoi` Data Dictionary updated to reflect actual database schema.

---

### NO CODE CHANGES REQUIRED
This documentation alignment requires **ZERO** source code, database, migration, or test changes. The repository implementation is already stable and correct.
