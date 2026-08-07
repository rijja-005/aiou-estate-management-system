# Phase 5 - Master Data and Shared Property Foundation

## Objective
Implement the first production-grade vertical slice for shared master data and property foundations, including:
- Buildings
- Floors
- Departments
- Property types
- Room types
- Facilities
- Property records
- Search/filter/sort/pagination APIs
- Audit logging for create operations

## Affected File Tree
```text
prisma/
  schema.prisma
  seed.ts
  migrations/
    20260803_phase5_master_data_property/
      migration.sql
src/
  app/
    api/
      v1/
        master-data/
          buildings/route.ts
          floors/route.ts
          departments/route.ts
          property-types/route.ts
          room-types/route.ts
          facilities/route.ts
        properties/route.ts
  server/
    api/
      auth-context.ts
      list-query.ts
      list-query.test.ts
      response.ts
    audit/
      service.ts
    master-data/
      schemas.ts
      schemas.test.ts
      service.ts
    properties/
      schemas.ts
      schemas.test.ts
      service.ts
```

## Deliverables Produced
- Normalized schema additions for master-data, shared property, status enums, and audit logs.
- REST APIs under `/api/v1/master-data/*` and `/api/v1/properties`.
- Consistent list-query parsing and response envelope utilities.
- Permission-aware request context checks on all new endpoints.
- Property creation with facility mappings in a transaction.
- Audit entries for create operations.
- Detail, update, and soft-archive APIs for all Phase 5 resources.
- Before/after audit entries for update and archive operations.
- Reference protection prevents archiving master data used by active properties.
- Property-floor/building consistency validation on create and update.
- Responsive master-data and property administration screens.
- Live dashboard property statistics and recent audit activity.
- Idempotent seed updates for roles, permissions, and optional super-admin bootstrap.
- SQL migration artifact generated from schema diff.
- Unit tests for list-query parsing and schema validation.

## Endpoint Inventory (Phase 5)
- `GET /api/v1/master-data/buildings`
- `POST /api/v1/master-data/buildings`
- `GET /api/v1/master-data/floors`
- `POST /api/v1/master-data/floors`
- `GET /api/v1/master-data/departments`
- `POST /api/v1/master-data/departments`
- `GET /api/v1/master-data/property-types`
- `POST /api/v1/master-data/property-types`
- `GET /api/v1/master-data/room-types`
- `POST /api/v1/master-data/room-types`
- `GET /api/v1/master-data/facilities`
- `POST /api/v1/master-data/facilities`
- `GET /api/v1/properties`
- `POST /api/v1/properties`
- `GET/PATCH/DELETE /api/v1/master-data/{resource}/{id}`
- `GET/PATCH/DELETE /api/v1/properties/{id}`
- `GET /api/v1/audit?entityType={type}&entityId={id}`

## Query and List Conventions
Supported query params on list endpoints:
- `page`
- `pageSize`
- `sort`
- `order`
- `search`
- `isEnabled`

Additional filters:
- Floors: `buildingId`
- Properties: `buildingId`, `propertyTypeId`, `status`

## Commands Used to Validate This Increment
- `npm run db:generate`
- `npm run typecheck`
- `npm test`
- `npm run build`

## Environment Variable Changes
Added in `.env.example`:
- `SEED_SUPERADMIN_EMAIL`
- `SEED_SUPERADMIN_PASSWORD`
- `SEED_SUPERADMIN_NAME`

## Acceptance Criteria
- New master-data and property tables exist in Prisma schema.
- Migration SQL exists at `prisma/migrations/20260803_phase5_master_data_property/migration.sql`.
- All new endpoints perform auth checks and input validation.
- List endpoints support pagination/sorting/filtering/search.
- Property creation persists facility mappings transactionally.
- Create operations produce audit records.
- Tests pass.
- Build and typecheck pass.

## Risks, Assumptions, and Open Questions
- Assumption: `property.read` and `property.manage` permissions are sufficient for all Phase 5 endpoints.
- Update/archive operations use soft deletion and preserve historical references.
- CSRF validation is enforced on every Phase 5 mutation.
- Open question: Whether to split `property.manage` into finer permissions (`master_data.manage`, `property.manage`) in the next phase.
- Open question: Whether to add module-scoped permission checks by building/department in this release or defer to a dedicated authorization scope phase.

## Phase Status

Phase 5 acceptance criteria are satisfied. Unit tests, PostgreSQL lifecycle integration tests, lint, type checking, dependency audit, and production build pass.
