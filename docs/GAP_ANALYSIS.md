# FULL PROJECT GAP ANALYSIS: HE_THONG_SALON

## 1. PURPOSE
This document provides a formal GAP analysis identifying discrepancies between the canonical requirements (`BaoCaoMoi (1).docx`), the technical specifications (`SPEC.md`), the AI implementation rules, and the actual source code. It outlines missing requirements, database conflicts, AI compliance issues, test failures, and recommended remediation phases.

## 2. REQUIREMENT GAP TABLE

| ID | Requirement | Source | Current Implementation | Status | Evidence | Gap | Impact | Priority | Proposed Action |
|----|-------------|--------|------------------------|--------|----------|-----|--------|----------|-----------------|
| FR01 | Đăng nhập hệ thống | BaoCaoMoi | Implemented in backend `auth.py` and frontend `LoginPage.jsx` | IMPLEMENTED | API `/auth/login`, JWT usage | None | None | - | - |
| FR02 | Quản lý phân quyền (RBAC) | BaoCaoMoi | Backend uses `require_roles`, but no UI exists | PARTIAL | `backend/app/services/auth_service.py` | Missing Frontend Role/User UI | Admin cannot manage staff access | P1 | Create Users/Roles UI |
| FR03 | Quản lý khách hàng | BaoCaoMoi | CRUD and History implemented | IMPLEMENTED | `customers.py`, `CustomersPage.jsx` | N+1 Query in list API | Performance risk | P2 | Refactor `get_customers` |
| FR04 | Quản lý thợ & Lịch làm việc | BaoCaoMoi | Implemented with `StylistsPage` and `schedules` | IMPLEMENTED | `hairdressers.py`, `schedules` table | None | None | - | - |
| FR05 | Quản lý dịch vụ | BaoCaoMoi | Full CRUD on Services | IMPLEMENTED | `services.py`, `ServicesPage.jsx` | None | None | - | - |
| FR06 | Quản lý lịch hẹn (Booking) | BaoCaoMoi | Booking and Anti-overlap logic exists | IMPLEMENTED | `test_booking_overlap.py` | README claims fail, but passes | Documentation mismatch | P3 | Update README |
| FR07 | Hóa đơn & Thanh toán | BaoCaoMoi | DB mismatch between report and implementation | CONFLICT | `payments` vs `INVOICE_DETAILS` | Invoice Details missing | Reporting divergence | P0 | Decision required |
| FR08 | Tra cứu & Thống kê | BaoCaoMoi | Dashboard analytics working | IMPLEMENTED | `analytics.py`, `AnalyticsPage.jsx` | None | None | - | - |
| FR09 | AI hỗ trợ Salon | BaoCaoMoi | Gemini integration works, but logging missing | CONFLICT | `ai_service.py` | Missing `AI_LOGS` implementation | Audit non-compliance | P1 | Implement AI DB logging |

## 3. DATABASE GAP ANALYSIS

### A. USERS.role versus roles table
- **Report Specifies**: `USERS` table with a `role` column (VARCHAR).
- **Actual Implementation**: Normalized `roles` table linked via `role_id` in `users` table.
- **Tables Involved**: `users`, `roles`
- **Relationships**: `Role` 1:N `User`
- **Backend Models**: `models/user.py` (`Role`, `User`)
- **Impact if changed**: Changing the code to match the report would require dropping the `roles` table, modifying user models, rewriting RBAC logic, and modifying seed data.
- **Migration Risk**: High. Code is already functional with a normalized structure.
- **DECISION REQUIRED**:
  - **Option 1**: Update `BaoCaoMoi (1).docx` to reflect the normalized `roles` table.
  - **Option 2**: Refactor backend to drop `roles` table and use Enum/VARCHAR column as specified.

### B. INVOICE_DETAILS versus payments
- **Report Specifies**: `INVOICE_DETAILS` table linking `invoice_id` to `service_id` with `quantity`, `unit_price`, `amount`.
- **Actual Implementation**: `payments` table linking `invoice_id` with `amount`, `payment_method`, and `payment_status`. No `invoice_details` model exists. Services are linked via `appointment_services`.
- **Tables Involved**: `invoices`, `payments`, `appointment_services`
- **Backend Models**: `models/invoice.py`, `models/payment.py`
- **Impact if changed**: Re-engineering checkout flow.
- **Migration Risk**: High.
- **DECISION REQUIRED**:
  - **Option 1**: Update documentation to explain that invoice details are inferred from `appointment_services`, and `payments` is an additional enhancement.
  - **Option 2**: Implement `INVOICE_DETAILS` and remove `payments` to strictly adhere to the report.

### C. AI_LOGS
- **Report Specifies**: `AI_LOGS` table to track all interactions with Gemini AI.
- **Actual Implementation**: Completely missing. Code has `# Ghi nhận nhật ký AI nếu hệ thống có triển khai AI_LOGS.` but no actual persistence.
- **Tables Involved**: Missing `ai_logs`
- **Backend Models**: Missing `AILog`
- **Impact if changed**: Easy to add. Improves compliance.
- **Migration Risk**: Low.
- **DECISION REQUIRED**:
  - **Option 1**: Implement `AI_LOGS` schema and integrate into `AIService`.

## 4. AI GAP ANALYSIS

| Feature/Requirement | Status | Notes / Evidence |
|---------------------|--------|------------------|
| Gemini integration | IMPLEMENTED | `genai.Client` used in `ai_service.py` |
| Catalog grounding | IMPLEMENTED | `services_catalog` passed into prompt |
| Service recommendation | IMPLEMENTED | `get_recommendations` logic working |
| Hairstyle/color recommendation | IMPLEMENTED | Evaluated inside recommendation prompt |
| Budget handling | IMPLEMENTED | Prompt includes `budget_max` |
| Customer history | IMPLEMENTED | Retrieved and parsed in summary/recommendation |
| Post-service care | IMPLEMENTED | `generate_care_message` works |
| Reminder generation | IMPLEMENTED | Works inside message generator |
| Structured JSON | IMPLEMENTED | Output forced to JSON and parsed strictly |
| Temperature | IMPLEMENTED | `temperature=0.2` (Recommendation), `0.3` (Care) |
| Service catalog validation | IMPLEMENTED | Output JSON validated against `services_catalog_map` |
| Hallucination protection | IMPLEMENTED | Strong system prompts + strict output validation |
| Invalid service handling | IMPLEMENTED | Strips invalid services and selects fallback active service |
| Invalid price handling | IMPLEMENTED | Prices sourced entirely from DB, not AI text |
| Error handling | IMPLEMENTED | `_generate_with_retry` and try/except parsing |
| Fallback behavior | IMPLEMENTED | Intelligent `_fallback_recommendation_logic` exists |
| AI logging | **MISSING** | `AI_LOGS` missing from Database |

## 5. FRONTEND GAP ANALYSIS

### FR02: Quản lý phân quyền (Role/User Management)
- **Frontend page exists?**: No.
- **Route exists?**: No.
- **Component exists?**: No.
- **API exists?**: Backend has auth endpoints, but no user management CRUD for UI.
- **Backend authorization exists?**: Yes (`require_roles`).
- **RBAC exists?**: Yes.
- **Role assignment works?**: Only via seed data or raw DB insertion.
- **Unauthorized access is blocked?**: Yes, correctly rejected with 403 Forbidden.
- **Tests exist?**: Yes, `test_admin_access_user_list` exists in backend.
- **Status**: **PARTIAL** (Backend API works, Frontend missing).

## 6. BACKEND GAP ANALYSIS

| Area | Status | Notes |
|------|--------|-------|
| Authentication | IMPLEMENTED | JWT + Bcrypt |
| RBAC | PARTIAL | Implemented, but `SPEC.md` highlights duplicate/hardcoded strings |
| Exception handling | IMPLEMENTED | Standard HTTP exceptions |
| Booking overlap | IMPLEMENTED | All tests pass, but README claims 1 test fails |
| Transaction handling | IMPLEMENTED | DB commits used |

### N+1 Queries
- **Exact file**: `backend/app/routers/customers.py`
- **Exact function**: `get_customers()`
- **Affected query**: Inside the loop iterating over customers, querying `appointment_count` and `total_spent` for each.
- **Why N+1 occurs**: Missing SQL `JOIN` and `GROUP BY` aggregations in the main query.
- **Expected impact**: Slow API responses as the customer table grows.
- **Proposed optimization direction**: Use SQLAlchemy `func.count`, `func.sum` and `outerjoin` in a single query.

## 7. TEST GAP ANALYSIS

| Test | Expected | Actual | Root Cause | Requirement | Priority | Fix Direction |
|------|----------|--------|------------|-------------|----------|---------------|
| `test_check_overlap_day_off` | `is_available == False` and "nghỉ vào ngày này" message | PASSED | Test passes locally, but `README.md` claims it fails. Documentation is outdated. | FR06 / NFR04 | P3 | Update `README.md` to reflect 100% test pass rate. |

## 8. API TRACE

| Method | Endpoint | Router | Auth | Role | Frontend Consumer | Status |
|--------|----------|--------|------|------|-------------------|--------|
| POST | `/api/v1/auth/login` | `auth.py` | No | Any | `authAPI.login` | IMPLEMENTED |
| GET | `/api/v1/auth/me` | `auth.py` | Yes | Any | `authAPI.getMe` | IMPLEMENTED |
| GET | `/api/v1/customers/` | `customers.py` | Yes | Admin, Recep, Stylist | `customerAPI.getAll` | IMPLEMENTED (N+1 Risk) |
| POST | `/api/v1/appointments/book`| `appointments.py` | No | Public | `appointmentAPI.publicBook`| IMPLEMENTED |
| POST | `/api/v1/ai/recommend` | `ai.py` | No | Public/Staff | `aiAPI.getRecommendations` | IMPLEMENTED |

*(Representative trace showing functional wiring between React services and FastAPI routers).*

## 9. GAP PRIORITY

- **P0**: Decide on `INVOICE_DETAILS` vs `payments` schema.
- **P1**: Implement `AI_LOGS` (Missing Requirement). Create Users/Roles Management UI (Missing Frontend FR02).
- **P2**: Fix N+1 Query in `customers.py` (Technical Debt). Refactor duplicated RBAC check (Maintainability).
- **P3**: Documentation alignment.

## 10. RECOMMENDED FIX ORDER

### PHASE 0: Decision / specification conflicts
- **Objective**: Finalize Database structure rules.
- **Files**: `BaoCaoMoi (1).docx`, `SPEC.md`.
- **Acceptance Criteria**: Decisions made for `USERS` vs `roles` and `INVOICE_DETAILS` vs `payments`.

### PHASE 1: Critical correctness and failed tests
- **Objective**: Resolve remaining test discrepancies (Currently 100% passing).
- **Files**: `README.md`.
- **Acceptance Criteria**: `README.md` accurately reflects 100% test pass rate.

### PHASE 2: Database and backend alignment
- **Objective**: Resolve DB mismatches based on Phase 0 decisions.

### PHASE 3: Missing frontend functionality
- **Objective**: Implement FR02 Quản lý phân quyền.
- **Files**: `frontend/src/pages/UsersPage.jsx`.
- **Acceptance Criteria**: Admin can view, add, and assign roles to staff in UI.

### PHASE 4: AI logging and AI compliance
- **Objective**: Add `AI_LOGS` table and implement save logic in `AIService`.
- **Files**: `backend/app/models/ai_log.py`, `backend/app/services/ai_service.py`.
- **Acceptance Criteria**: All AI requests are logged to DB.

### PHASE 5: Performance / N+1 / RBAC refactoring
- **Objective**: Fix N+1 queries in customer API and clean up RBAC duplicated code.
- **Files**: `backend/app/routers/customers.py`, `backend/app/services/auth_service.py`.

### PHASE 6: Full regression testing
- **Objective**: Re-run all tests.
- **Acceptance Criteria**: E2E and Unit tests pass.

### PHASE 7: Final documentation synchronization
- **Objective**: Update README.

## 11. DECISIONS REQUIRED

**DECISION-001: USERS.role vs roles table**
- **Requirement source**: `BaoCaoMoi (1).docx`
- **Current implementation**: Normalized `roles` table.
- **Conflict**: Requirement asks for simple `role` VARCHAR column.
- **Options**: 1. Keep normalized table and update report. 2. Flatten table to match report.
- **Impact**: Database schema migration required if changed.
- **Recommended evidence to inspect**: `backend/app/models/user.py`.
- **Final decision**: **PENDING**

**DECISION-002: INVOICE_DETAILS vs payments**
- **Requirement source**: `BaoCaoMoi (1).docx`
- **Current implementation**: `payments` table exists; missing `invoice_details`.
- **Conflict**: Divergence in how billing data is modeled.
- **Options**: 1. Document how `appointment_services` replaces details. 2. Build `INVOICE_DETAILS`.
- **Impact**: Changes checkout API.
- **Recommended evidence to inspect**: `backend/app/models/invoice.py` and `payment.py`.
- **Final decision**: **PENDING**

**DECISION-003: AI_LOGS requirement**
- **Requirement source**: `BaoCaoMoi (1).docx`
- **Current implementation**: Completely missing.
- **Conflict**: Missing core requirement.
- **Options**: 1. Implement `AI_LOGS`.
- **Impact**: Requires new DB table and logic in AI Service.
- **Recommended evidence to inspect**: `backend/app/services/ai_service.py`.
- **Final decision**: **PENDING**

## 12. ACCEPTANCE CRITERIA
The project should only be considered synchronized when:
- all P0 gaps are resolved
- all required P1 gaps are resolved
- failed tests are fixed
- frontend/backend API flow is verified
- database model is consistent with approved specification
- AI behavior follows the AI Skill
- AI catalog grounding is verified
- RBAC is verified
- regression tests pass
- README is synchronized
- report evidence is synchronized
