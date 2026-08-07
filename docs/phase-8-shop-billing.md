# Phase 8 - Shop Management and Billing

## Objective

Implement shop tenants, agreements, utility rules, monthly receivables, arrears, payments, reversals, receipts, notices, and financial summaries.

## Accounting Decision

The phase implements a receivables subledger, not double-entry accounting. Bills establish tenant receivables; payment allocations reduce specific bill balances; unallocated payment amounts remain visible as advance credit. This boundary must be revisited only if AIOU confirms general-ledger integration requirements.

## Deliverables

- Tenant profiles with normalized CNIC/phone and masked list DTOs.
- Shop agreements with active-property uniqueness, suspension, expiry, termination, and cancellation.
- Fixed and metered utility rules.
- Prorated first/final rent, adjustments, discounts, arrears carry-forward, and idempotent late charges.
- Decimal-only bills, partial/full payments, advance credit, authorized reversal, and immutable allocations.
- Printable receipts and rent/arrears notices.
- Financial summary API for billed, collected, outstanding, and payment totals.
- Responsive shop operations screen.
- Shop/finance/payment permissions and audit history.

## Validation

- PostgreSQL migration and constraints applied.
- Decimal calculation tests cover proration, late fees, and payment status.
- Database integration test covers bill generation, partial payment, and reversal.

## Risks and Follow-up

- Stored signed PDF artifacts and template versioning will use the shared document/report infrastructure in Phase 10.
- External accounting integration is outside the confirmed receivables-subledger scope.

## Phase Status

Phase 8 acceptance criteria are satisfied.
