# Booking resource integrity runbook

This runbook covers the resource and capacity booking model. It is a verification and recovery guide; it does not authorize deployment or a database migration on the application database.

## Preconditions and model

- Run commands from `server` with dependencies installed and `DATABASE_URL` supplied through the environment. Never put a credential in a command argument, source file, report, or CI log.
- A resource booking requires an active `place_resources` row whose `service_id` and `place_id` exactly match the requested active service. Capacity bookings do not select a resource.
- The persisted canonical interval is calculated once from the requested Vietnam-local booking time, service slot duration, and buffer. All create and reschedule paths must reuse that interval; a client-provided end time is never authoritative.
- A direct `bookingAt` string must carry `Z` or an explicit numeric UTC offset such as `+07:00`; zone-less timestamps are rejected before database access. The separate `useDate` plus `useTime` fields remain Vietnam wall-clock input and are converted with the `Asia/Ho_Chi_Minh` policy.
- Booking idempotency keys are unique per user, not globally. Same-user retries serialize and replay one booking; two users may independently use the same opaque key without seeing or receiving each other's booking.
- Resource conflicts use strict interval overlap: adjacent intervals where one ends exactly when the next starts are allowed. Cancelled, rejected, expired, and soft-deleted bookings do not consume a resource or capacity.
- Capacity is evaluated in the canonical minute bucket for active pending/confirmed bookings. `allowOverbooking: true` is a literal opt-out from the capacity limit, not a UI-only hint and not an implicit permission for invalid resources.

## Stable booking errors

Clients may branch only on the following stable error codes:

| Code | Meaning |
| --- | --- |
| `BOOKING_RESOURCE_REQUIRED` | A resource-model booking omitted `resourceId`. |
| `BOOKING_RESOURCE_INVALID` | The resource is missing, inactive, or does not belong to the requested service and place. |
| `BOOKING_SLOT_CONFLICT` | An active booking already owns an overlapping interval on that resource. |
| `BOOKING_CAPACITY_EXCEEDED` | The active capacity in the canonical bucket is exhausted and literal overbooking is disabled. |

Do not infer policy from translated message text or HTTP status alone.

## Verification gate

Run the booking gate before release review:

```powershell
npm run quality:booking
npx.cmd prisma validate --schema=prisma/schema.prisma
npm run audit:booking:orphans
```

`quality:booking` runs policy, availability, public-route, time-slot, and live PostgreSQL integrity coverage. The live test derives a fresh, entropy-bearing database name from `DATABASE_URL`, applies migrations from disk, and drops only the invocation-owned database. It never deploys to, pushes to, resets, or writes application data.

The forward migration `20260721210000_scope_booking_idempotency_per_user` replaces the historical global key index with the validated composite `(user_id, idempotency_key)` index. Deploy that migration through the separately authorized production migration workflow before running application code that depends on tenant-scoped keys; never recreate or drop either index manually.

Run the migration-history gate separately when a release contains migrations:

```powershell
npm run quality:migrations
```

Run `audit:booking:orphans` only after booking gates have stopped; it is a read-only check for databases created by this booking test label and must return `0`. For a safe concurrency rehearsal, point `DATABASE_URL` at a PostgreSQL server where the account can create disposable databases, then run only `npm run quality:booking`. The test deliberately holds real row locks and proves two simultaneous resource/capacity contenders serialize to the expected result. Do not run ad-hoc concurrent create scripts against the application database.

## Observability and incident response

Record the stable error code, service ID, resource ID when applicable, canonical start/end, requested quantity, booking model, and request/correlation ID. Do not record card data, raw gateway payloads, or credentials. Alert on sustained `BOOKING_SLOT_CONFLICT`, `BOOKING_CAPACITY_EXCEEDED`, lock timeouts, and unexpected changes in resource-invalid errors.

When an incident is reported, first preserve the booking IDs and request IDs, inspect the affected service/resource and the active booking intervals using normal read-only support tooling, then compare the persisted interval with the canonical policy. Retry only an explicitly idempotent request with the same idempotency key. Never repair availability by manually editing booking timestamps, statuses, resource IDs, quantities, or capacity rows in the database.

## Rollback expectations

Application rollback means returning traffic to a previously approved application build after confirming that its booking model is compatible with the deployed schema. It does not mean deleting bookings, resources, or migration history. Before any separately authorized schema rollback, require a current tested backup, a restore drill, an approved migration-specific recovery plan, and owner approval. Do not use `prisma migrate reset`, `prisma db push`, or manual SQL edits as incident recovery.

If a disposable audit cleanup fails, retain the exact prefix-validated name from the test output and have a PostgreSQL operator investigate it after gates stop. Do not run wildcard or prefix-wide drop commands. A read-only orphan inspection is appropriate only when no audit gate is active:

```sql
SELECT datname
FROM pg_database
WHERE datname LIKE 'didaugio_codex_migration_%_booking_%'
ORDER BY datname;
```
