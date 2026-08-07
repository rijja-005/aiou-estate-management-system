# Phase 11 — Production hardening and deployment

Phase 11 is complete at the repository level. Creating cloud resources and promoting a release remain operator-controlled external actions.

## Review outcomes

### Security

- Server-side permission checks protect domain and report routes; mutations additionally validate CSRF tokens.
- Authentication uses secure cookies, rotating refresh-token families, revocation, password hashing, persistent throttling, and reset-token expiry.
- Security headers cover clickjacking, MIME sniffing, referrers, browser permissions, opener isolation, and CSP.
- Cron access uses an independent 32+ character secret. Report artifacts are ownership checked, private, and `no-store`.
- Secrets remain environment variables; `.env*` and container build contexts exclude them.
- `npm audit --audit-level=high` is a required CI gate.

### Performance and database

- Operational searches are bounded and fan out concurrently; each source returns at most eight rows.
- Exports use dedicated projections rather than exposing full entities. Audit export is capped at 10,000 rows; larger deployments should move result bodies to configured object storage.
- Workflow lookup, status/date, normalized identifiers, report queue, scheduled runs, and active-allocation constraints are indexed.
- PostgreSQL partial unique indexes remain the authoritative concurrency guard for active allocations.

### Accessibility and responsive design

- Core inputs have native labels or accessible names, status messages use live-region semantics, tables retain semantic headings, focusable controls use native elements, and theme contrast uses the shared palette.
- Tables and navigation use horizontal overflow or responsive breakpoints; forms collapse to one column; cards expand progressively.
- Before public launch, perform a manual keyboard/screen-reader pass with representative users and the organization’s supported browser matrix.

## Environments

Create separate preview and production projects/databases/storage buckets. Never point preview at production data.

Required secrets: `DATABASE_URL` (pooled runtime URL), `DIRECT_DATABASE_URL` (migration URL), `AUTH_SECRET`, `CRON_SECRET`, and production seed credentials only during initial provisioning. Configure `OBJECT_STORAGE_ENDPOINT` and `OBJECT_STORAGE_BUCKET` before stored documents are enabled. Optional monitoring uses `SENTRY_DSN`.

## Deployment workflow

1. CI installs with `npm ci`, audits dependencies, generates Prisma, applies migrations to an isolated test database, seeds it, then runs lint, typecheck, all tests, and build.
2. Deploy a preview using preview-only environment variables. Run `/api/v1/health` and `/api/v1/health/ready`, authentication, one read workflow, and one reversible write workflow.
3. Take and verify a database backup.
4. Apply migrations with `npm run db:deploy` using `DIRECT_DATABASE_URL`. Migrations are forward-only; do not use `migrate dev` in production.
5. Promote the tested artifact, verify readiness, scheduled job authorization, logs, and alerting, then monitor error rate and database saturation.

## Backup and recovery

- Enable managed PostgreSQL point-in-time recovery and daily encrypted backups in a different failure domain. Retain daily backups for 35 days and monthly backups according to AIOU policy.
- Back up object storage with versioning and lifecycle retention. Database and object backups must share a recovery identifier.
- Quarterly, restore into an isolated account, run migrations if required, execute readiness and smoke tests, and record achieved RPO/RTO. A backup is not accepted until a restore succeeds.
- For recovery: freeze writes, identify the incident boundary, restore database and corresponding objects, rotate exposed secrets, run consistency queries and smoke tests, then reopen traffic with an incident audit record.

## Monitoring

Monitor availability, `/health/ready`, request error rate/latency, PostgreSQL connections and storage, failed report/scheduled jobs, overdue cron execution, authentication throttling, and backup age. Structured server logs must be shipped to the hosting log sink; configure `SENTRY_DSN` or an approved equivalent for exception tracking and release correlation.

## Final acceptance checklist

- [x] Schema migrations are forward-only and applied successfully.
- [x] CI, Vercel, optional Docker, cron, health, and environment contracts exist.
- [x] Permission, CSRF, search bounds, download ownership, and job idempotency controls exist.
- [x] Lint, TypeScript, unit/integration tests, dependency audit, and production build are required gates.
- [ ] Stakeholder supplies production database, storage, monitoring, DNS, and secrets.
- [ ] Operator completes preview smoke test, restore drill, production migration, promotion, and post-release monitoring.
