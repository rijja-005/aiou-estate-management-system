# Phase 7 - Office Allocation

## Objective

Implement the complete office allocation lifecycle with approval, activation, reassignment, vacation, inventory handover, history, documents, permissions, and tests.

## Decisions

- Active allocations are immutable in identity; reassignment closes the old record and creates a new active allocation.
- PostgreSQL enforces one active allocation per property through a partial unique index.
- Every state transition creates an append-only history event and audit record.
- Activating/vacating an allocation synchronizes the property occupancy status.
- Inventory condition changes are movements, not destructive overwrites.

## Deliverables

- Allocation, history, inventory catalogue, property inventory, and movement models.
- Draft, submit, approve, activate, reassign, vacate, and cancel workflows.
- REST APIs for allocations, actions, inventory handover/return, and printable documents.
- Responsive allocation management screen with activity timelines.
- Permission matrix extensions for allocation read/create/approve/manage.
- Printable allocation and vacation records with browser PDF support.

## Validation

- Migration deployed and seed permissions updated.
- PostgreSQL integration test verifies active-allocation uniqueness and reassignment history.
- Unit, lint, type, security audit, and production build checks pass.

## Risks and Follow-up

- Signed stored PDF artifacts will use the Phase 10 reporting/storage job infrastructure; Phase 7 provides secure printable records.
- Inventory photos and document attachments remain part of the later shared document/storage increment.

## Phase Status

Phase 7 acceptance criteria are satisfied.
