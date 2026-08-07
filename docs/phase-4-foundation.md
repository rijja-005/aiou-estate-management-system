# Phase 4 - Foundation and Authentication Hardening

## Objective
Establish the initial Next.js project structure, common tooling, environment validation, logging, basic UI shell, health endpoints, and the first auth-facing scaffold.

## Current Deliverables
- Package manifest with pinned dependencies.
- Initial App Router structure.
- Protected dashboard shell and login screen.
- Health and readiness endpoints.
- Environment-variable contract.
- Logger setup.
- Prisma auth skeleton.
- Seed entry point.
- Prisma client singleton.
- Password hashing and verification helpers.
- Permission-check helpers with tests.
- Unit-test coverage for env, authorization, permissions, and password helpers.
- Production build verified successfully.
- Auth route handlers for login, session lookup, refresh, and logout.
- RBAC/session schema for users, roles, permissions, sessions, and refresh tokens.
- Prisma client generation verified successfully.
- Database-backed access-token session and account validation.
- Rotating refresh tokens with reuse detection and token-family revocation.
- Current-device and all-device logout with persistent revocation.
- CSRF validation backed by the session record and applied to protected mutations.
- Persistent login throttling with temporary blocking.
- One-time password-reset tokens, configurable delivery webhook, and reset screens.
- Password reset revokes all existing sessions.
- Authentication audit events for login and logout activity.
- Baseline security response headers.
- Dependency audit reduced to zero known vulnerabilities.

## Deployment Requirements
- Password-reset delivery requires `PASSWORD_RESET_DELIVERY_URL` and `PASSWORD_RESET_DELIVERY_TOKEN`.
- Production cookie, database, delivery, and application URLs must be supplied through the deployment environment.

## Acceptance Criteria
- The project has a coherent, reviewable foundation.
- Root redirects to the protected dashboard flow.
- `/login` and `/dashboard` route shells exist.
- Health endpoints return stable JSON.
- The repo is ready for the next auth and schema increment.

## Validation

- `npm run db:generate`
- `npm run lint`
- `npm run typecheck`
- `npm test` (19 tests passing)
- `$env:RUN_DATABASE_TESTS='true'; npm test` (20 tests passing, including live PostgreSQL authentication lifecycle)
- `npm run build`
- `npm audit` (0 known vulnerabilities)

## Phase Status

Phase 4 acceptance criteria are satisfied. The local database migration is applied, the Super Admin seed is verified, the HTTP login/session/logout flow passes, refresh-token rotation and reuse detection pass, and the production build succeeds.
