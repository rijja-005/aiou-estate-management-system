# AIOU Estate Management System

Enterprise estate management platform for Allama Iqbal Open University, built as a modular-monolith Next.js application.

Current status:
- Phase 1 requirements analysis completed in repository form
- Phase 2 database design is completed in repository form
- Phase 3 application architecture is completed in repository form
- Phase 4 foundation and authentication is complete and validated
- Phase 5 master-data and shared-property foundation is complete
- Phase 6 shared booking engine is complete
- Phase 7 office allocation is complete
- Phase 8 shop management and billing is complete
- Phase 9 residential flat allocation is complete
- Phase 10 reports, global search, and scheduled notifications is complete
- Phase 11 production hardening and deployment assets are complete
 
Implementation notes:
- App build and TypeScript checks currently pass.
- Prisma client generation currently passes.
- Master-data and property REST endpoints are available under `/api/v1`.
- Authentication includes database-backed sessions, rotating refresh tokens, revocation, CSRF protection, persistent login throttling, and password reset.
- Residential-flat workflows are available at `/flats`, including grade eligibility, retirement alerts, transfers, extensions, and printable vacation notices.
- Reports and exports are available at `/reports`; global search is available in the protected application header.
- CI, Vercel cron configuration, optional Docker deployment, health/readiness checks, and production runbooks are included.

Primary principles:
- Single Next.js codebase
- PostgreSQL + Prisma
- Secure cookie-based authentication
- Role- and permission-based authorization
- Immutable audit trail for sensitive actions
- Production-first, phased delivery
