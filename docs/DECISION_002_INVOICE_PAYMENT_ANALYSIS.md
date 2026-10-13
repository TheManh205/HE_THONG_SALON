# DECISION-002: INVOICE_DETAILS vs PAYMENTS Analysis

## 1. Executive Summary
This document analyzes the architectural gap regarding billing and payments in the `HE_THONG_SALON` project (DECISION-002). The formal report specifies an `INVOICE_DETAILS` entity, while the current codebase implements a `payments` table and relies on `appointment_services`. After inspecting the database models, backend logic, and frontend usage, the analysis concludes that `payments` is a critical transaction-tracking entity that cannot be replaced by `INVOICE_DETAILS`. Furthermore, the existing `appointment_services` table effectively acts as the invoice line items, fulfilling the business requirement of `INVOICE_DETAILS` without needing a redundant table.

## 2. Report Evidence
Based on the `BaoCaoMoi (1).docx` specifications and previous audit findings:
- **Entity**: `INVOICE_DETAILS` (Chi tiết hóa đơn).
- **Required Columns**: `invoice_id`, `service_id`, `quantity`, `unit_price`, `amount`.
- **Business Purpose**: To link an invoice to the specific services rendered and their respective prices at the time of checkout.

## 3. Current Implementation
The current implementation in `backend/app/models/` uses the following structure:
- **`invoices` (Invoice Header)**: Stores `appointment_id`, `total_amount`, `discount_amount`, `final_amount`, `payment_method`, and `payment_status`. (1:1 relationship with `appointments`).
- **`payments` (Payment Transaction)**: Stores `invoice_id`, `amount`, `payment_method`, `payment_status`, `transaction_code`, and `paid_at`.
- **`appointment_services`**: Stores `appointment_id`, `service_id`, and `price_at_booking`.

## 4. Data Model Comparison

### A. PAYMENT TRANSACTION
- **Responsibility**: Track the actual transfer of funds (cash, bank transfer).
- **Current Table**: `payments`
- **Fields**: `amount`, `payment_method`, `transaction_code`, `paid_at`.
- **Match Status**: Explicitly modeled in code, though implicitly assumed in the original report.

### B. INVOICE HEADER
- **Responsibility**: Summarize the final bill for the customer.
- **Current Table**: `invoices`
- **Fields**: `total_amount`, `discount`, `final_amount`.
- **Match Status**: Matches report's `INVOICES`.

### C. INVOICE DETAIL
- **Responsibility**: Itemize the services billed.
- **Report Table**: `INVOICE_DETAILS`
- **Current Code**: Represented by `appointment_services`.

### D. APPOINTMENT SERVICE
- **Responsibility**: Link booked services to an appointment.
- **Current Table**: `appointment_services`
- **Fields**: `appointment_id`, `service_id`, `price_at_booking`.
- **Analysis**: Because `Invoice` has a strict 1:1 relationship with `Appointment`, the services linked to the appointment via `appointment_services` perfectly represent the line items of the invoice. The `price_at_booking` acts as the `unit_price`.

## 5. Code Usage Trace
- **`PaymentService` (`backend/app/services/payment_service.py`)**: Creates records in the `payments` table to handle transaction IDs (`TXN-xxx`), partial/failed payment attempts, and timestamping (`paid_at`).
- **`InvoiceService` (`backend/app/services/invoice_service.py`)**: Generates the invoice header linked to the appointment.
- **Usage Context**: The backend relies heavily on `payments` to prevent duplicate transactions and validate successful checkouts before marking an appointment as `COMPLETED`.

## 6. Frontend Usage Trace
- **`AppointmentsPage.jsx`**: Calls `paymentAPI.create()` during the checkout flow to process the payment after the invoice is created.
- **`InvoicesPage.jsx`**: Displays a printable receipt (Phiếu Thu) fetching data from the `invoices` table (Total, Discount, Final Amount, Payment Method). It **does not** explicitly list individual services on the printed receipt.
- **Conclusion**: The frontend actively expects and requires the payment transaction APIs to finalize bookings. It does not currently require a dedicated `INVOICE_DETAILS` endpoint.

## 7. Business Flow
1. **Customer** books an **Appointment**.
2. **Selected Services** are locked into the `appointment_services` table with their `price_at_booking`.
3. During checkout, an **Invoice** is generated summarizing the total cost of the appointment.
4. A **Payment** attempt is recorded in the `payments` table. If successful, the invoice and appointment statuses are updated to `PAID` and `COMPLETED`.

Entities involved: `appointments` → `appointment_services` → `invoices` → `payments`.

## 8. Gap Matrix

| Requirement | Report | Current Code | Status | Risk |
|-------------|--------|--------------|--------|------|
| Payment Transaction | Implicit | `payments` | MATCH | Low |
| Invoice Header | `INVOICES` | `invoices` | MATCH | Low |
| Invoice Detail | `INVOICE_DETAILS` | `appointment_services` | PARTIAL | Low |
| Service Pricing Lock | Implicit | `appointment_services` | MATCH | Low |

## 9. Architectural Options

- **OPTION A**: `payments` is sufficient and `INVOICE_DETAILS` is already represented by existing appointment/service structures (`appointment_services`).
- **OPTION B**: Keep `payments` AND add `invoice_details` as an additive structure (copying data from `appointment_services` upon invoice creation).
- **OPTION C**: Replace `payments` with `invoice_details`.

## 10. Recommended Decision
**OPTION A** is highly recommended. 
Replacing `payments` with `invoice_details` (Option C) is semantically incorrect because a "Payment" (transaction/cash flow) is fundamentally different from an "Invoice Detail" (billing line item). The `payments` table must be retained to handle transaction logic (e.g., Bank Transfer transaction IDs). 
Furthermore, since an invoice maps 1:1 to an appointment, the `appointment_services` table natively fulfills the role of `INVOICE_DETAILS` by locking in the `price_at_booking`. Creating a redundant `invoice_details` table (Option B) would violate database normalization principles without providing additional business value to the current UI flow.

## 11. Migration Impact
If Option A is selected:
- **Affected models**: None.
- **Affected repositories/services**: None.
- **Affected routers/schemas**: None.
- **Affected frontend**: None.
- **Migration requirements**: None. 
- **Documentation**: The specification (`BaoCaoMoi`) should be updated to clarify that line items are derived from `appointment_services`, and a `payments` table was added for robust transaction tracking.

## 12. Risks
- **Compliance Risk**: Academic/business evaluators might strictly look for a table physically named `INVOICE_DETAILS`.
- **Mitigation**: Update the ERD (Entity Relationship Diagram) in the report documentation to map `INVOICE_DETAILS` → `appointment_services` and add the `PAYMENTS` table.

## 13. Implementation Plan
- **Backend/Frontend**: No code changes required.
- **Documentation**: Update `SPEC.md` and `BaoCaoMoi (1).docx` to reflect the accepted mapping (Option A).

## 14. Validation Plan
- Verify that `pytest` suite continues to pass (specifically `test_invoice_creation_and_service_history`).
- Ensure the frontend checkout flow correctly processes `payments` and generates the printable receipt without errors.
