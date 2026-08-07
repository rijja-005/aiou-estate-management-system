# Phase 1 - Requirement Analysis and Domain Workflows

## Objective
Establish the domain boundaries, workflows, statuses, risks, and open decisions needed before database design and implementation.

## Decisions Made
- Use a modular-monolith architecture.
- Use a single Next.js App Router codebase for frontend and backend.
- Keep business logic out of React components, pages, Route Handlers, and Server Actions.
- Use PostgreSQL and Prisma.
- Use secure HttpOnly cookie-based auth with JWT access tokens and rotating refresh tokens.
- Use a normalized permission model rather than role-name checks alone.
- Use soft deletion for appropriate master and operational records.
- Preserve immutable audit history for sensitive actions.
- Use a shared property model with property-specific detail tables where needed.
- Use a shared booking engine for classrooms, workshops, auditoriums, Executive Club, and lawns.
- Store money as decimal values only.
- Store timestamps in UTC and display in Asia/Karachi.

## Key Workflow Decisions
- Booking lifecycle: Draft -> Pending Approval -> Approved -> Rejected -> Cancelled -> Completed -> Expired.
- Office allocation lifecycle: Draft -> Pending Approval -> Approved -> Active -> Reassigned -> Vacated -> Cancelled.
- Shop agreement lifecycle: Draft -> Active -> Suspended -> Expired -> Terminated -> Cancelled.
- Bill lifecycle: Draft -> Issued -> Partially Paid -> Paid -> Overdue -> Cancelled -> Written Off.
- Payment lifecycle: Pending -> Completed -> Reversed -> Failed.
- Flat allocation lifecycle: Draft -> Pending Approval -> Approved -> Active -> Transferred -> Vacated -> Cancelled.
- Retirement extensions must preserve original dates and calculations rather than overwriting them.
- Booking overlap prevention must be enforced transactionally and supported by database-level protection.

## Deliverables Produced
- Requirement analysis summary.
- Workflow definitions and state transitions.
- Initial role and permission matrix.
- Business-rule catalogue.
- Edge-case list.
- Risk register.
- Open questions for stakeholder confirmation.

## Acceptance Criteria
- Domain boundaries are clear enough to design normalized tables.
- Workflow state transitions are explicit.
- Major business rules and edge cases are documented.
- No schema or implementation code has been introduced in this phase.
- Open decisions are explicitly called out for stakeholder review.

## Risks and Assumptions
- Multi-resource bookings remain unresolved.
- Accounting scope for shops remains unresolved between receivables subledger and double-entry accounting.
- Approval authorities for financial reversals, discounts, and extensions remain unresolved.
- Urdu localization is assumed to be future-ready rather than required in the first release.
- Self-service portals are assumed out of scope for v1 unless confirmed otherwise.

## Stakeholder Questions
- Can one booking contain multiple resources?
- Is double-entry accounting required for the shop module?
- Which actions require approval by Estate Admin versus Account Officer?
- Should pending bookings block later bookings by default?
- What are the exact document retention and recovery requirements?
