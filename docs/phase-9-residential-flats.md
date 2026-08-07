# Phase 9 — Residential flat allocation

Phase 9 is complete. It adds employee and grade eligibility, residential-flat categorization, approval and possession workflows, transfers, vacation, retirement extensions, alerts, printable notices, and immutable lifecycle history.

## Business rules

- Categories B, C, and D define eligible BPS grade ranges, expected inventory, and a configurable post-retirement occupancy period.
- The vacation date is calculated from the employee retirement date using end-of-month-safe calendar arithmetic.
- Only one active allocation may exist for an employee or flat. This is enforced both by services and PostgreSQL partial unique indexes.
- Approval and extension require `flat.approve`; operational actions require `flat.manage`; viewing requires `flat.read`.
- A retirement extension stores both the previously approved date and revised date. It never rewrites historical snapshots.
- Transfers close the former allocation and create a new active allocation while retaining the approved vacation date.

## Interfaces

- Dashboard: `/flats`
- Employees: `/api/v1/employees`
- Flat setup and eligibility masters: `/api/v1/flat-masters`
- Allocations and actions: `/api/v1/flat-allocations`
- Retirement alerts: `/api/v1/flat-alerts`
- Printable vacation notice: `/api/v1/flat-allocations/{id}/notice`

All mutations use CSRF validation and permission checks. Sensitive employee identifiers are masked in list responses, and lifecycle mutations are audit logged.

## Verification

The integration suite covers submission, approval, possession, extension, transfer, vacation, property occupancy synchronization, and history retention. Unit tests cover ordinary and end-of-month vacation-date calculations.
