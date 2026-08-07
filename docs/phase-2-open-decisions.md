# Phase 2 - Open Decisions

## Confirm Before Implementation
- Multi-resource booking support in v1.
- Booking exclusion mechanism preference if a PostgreSQL exclusion constraint is not sufficient for all resource types.
- Exact active-allocation policy for offices and flats.
- Whether shop finance is receivables-only or true double-entry accounting.
- Whether campus support is required in v1.
- Whether soft-deleted master data must be recoverable by administrators.
- Whether there are existing AIOU numbering conventions for reference documents.
- Whether any database retention or archival policy exists for audit and notices.

## Recommended Default Assumptions
- Single-resource bookings in v1 unless multiple resources are confirmed.
- Receivables subledger for shop finance unless double-entry is explicitly required.
- UUID primary keys across core tables.
- Audit and financial records are immutable.
- Partial unique indexes and transactional checks for active allocations.
