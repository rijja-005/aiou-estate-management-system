# Phase 10 — Reports, global search, and notifications

Phase 10 is complete.

## Delivered

- Permission-aware global search across properties, bookings, office allocations, shop agreements, bills, and employees.
- Operational dashboard metrics for estate inventory, active workflows, arrears, retirement alerts, and unread notifications.
- CSV and JSON exports for properties, bookings, office allocations, shop finance, flats, and the audit log.
- Durable report-job records with ownership, status, timestamps, row counts, failure details, and protected downloads.
- An idempotent daily scheduled job that produces retirement-vacation and overdue-bill notifications for estate administrators.
- Report/search permissions and role assignments.
- Unit and PostgreSQL integration coverage for CSV escaping, report generation, search, and scheduled-job idempotency.

The daily endpoint is `/api/cron/daily` and requires `Authorization: Bearer $CRON_SECRET`. Vercel invokes it at 01:15 UTC daily. Report downloads are private and never cached.
