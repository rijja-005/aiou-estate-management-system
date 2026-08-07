# Phase 6 - Shared Booking Engine

## Objective

Provide one booking workflow for classrooms, workshops, auditoriums, Executive Club, lawns, and other enabled properties.

## Decisions

- A booking is a parent request with one or more resource reservations.
- All resources in a request share the same time window in this phase.
- The default UI duration is three hours; requests may use custom durations up to 24 hours.
- Pending overlaps are blocked by default and configurable through `BOOKING_BLOCK_PENDING_OVERLAPS`.
- Approved overlaps are always prevented by a PostgreSQL exclusion constraint.
- Global and property-specific closure windows block booking requests.

## Deliverables

- Booking, resource, approval-history, closure, and notification models.
- Draft, submit, approve, reject, cancel, complete, and expire lifecycle services.
- Idempotency keys and duplicate-request protection.
- Transactional conflict checks and database-level approved-overlap protection.
- Multi-resource booking requests.
- Booking list, detail, lifecycle, closure, and notification REST APIs.
- Responsive request form with agenda and calendar presentations.
- Permission-aware approval controls and in-app notifications.
- Immutable booking approval and audit history.

## Validation

- Prisma migration deployed successfully.
- 25 tests pass, including the PostgreSQL booking lifecycle and overlap test.
- ESLint, TypeScript, dependency audit, and production build pass.

## Acceptance Criteria

- Concurrent approved overlaps cannot be stored.
- Pending-overlap policy is configurable.
- Unavailable properties and closures are rejected.
- Lifecycle transitions require server-side permissions and valid current state.
- Approval decisions and sensitive changes are audited.
- Booking views remain usable on narrow screens.

## Risks and Follow-up

- Scheduled automatic expiry/completion will be connected to the background-job infrastructure in Phase 10.
- External email delivery remains provider-dependent; Phase 6 notifications are in-app.
- Complex per-resource time windows within one booking are intentionally deferred.

## Phase Status

Phase 6 acceptance criteria are satisfied.
