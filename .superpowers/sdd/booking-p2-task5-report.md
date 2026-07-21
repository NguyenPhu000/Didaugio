# P2 Booking Task 5 report

## Scope

- Added `server` aggregate gate `npm run quality:booking` for booking policy, availability contracts, public availability route contracts, Vietnam time-slot rules, and live PostgreSQL resource/capacity integrity.
- Added `app` focused gate `npm run test:booking` for resource availability selection rules.
- Added `npm run audit:booking:orphans`, a read-only check for this test suite's disposable databases after gates have stopped.
- Added `server/docs/booking-integrity-runbook.md` with resource prerequisites, stable errors, canonical interval/buffer semantics, literal overbooking, safe disposable-DB rehearsal, observability, recovery, and rollback boundaries.

## Fresh verification evidence

All commands were run from their stated project directory on 2026-07-21. No command deployed to, pushed to, reset, or wrote application data.

| Command | Result |
| --- | --- |
| `server: npm.cmd run quality:booking` | exit 0; 31 passed, 0 failed, 1 expected prerequisite skip; live PostgreSQL integrity case passed in 13.0 s; total 13.65 s. |
| `server: npx.cmd prisma validate --schema=prisma/schema.prisma` | exit 0; schema valid. |
| `server: npm.cmd run audit:booking:orphans` | exit 0; `owned_booking_audit_databases=0`, repeated after migration gate. |
| `server: npm.cmd run quality:migrations` | exit 0; 18 migrations applied on an owned clean audit database, 47 passed, 0 failed/skipped; 207.42 s test duration (223.5 s command wall time). |
| `app: npm.cmd run test:booking` | exit 0; 1 file and 5 tests passed. |
| `app: npx.cmd eslint "app/booking/[placeId].jsx" src/modules/booking/components/ResourcePicker.jsx src/modules/booking/utils/resourceAvailability.js src/modules/booking/utils/__tests__/resourceAvailability.test.js` | exit 0; no diagnostics. |
| `server: node --check src/scripts/verifyBookingAuditCleanup.js` | exit 0. |

The aggregate booking gate's one skipped test is intentional: it asserts that the live integration suite fails closed if `DATABASE_URL` is absent. With the configured environment, the real disposable-PostgreSQL test ran and passed.

## Cleanup and safety

The booking live test uses the shared entropy-bearing `didaugio_codex_migration_…_booking_…` ownership model and applies migrations from disk only to its created audit database. The new orphan command is read-only and returned zero after all gates stopped. The migration gate independently created, migrated, checked, and removed its own `…_clean` audit database.

## Remaining phase concerns

- The configured application database remains outside this task's mutation scope; its migration divergence, deployment, backup, and restore decisions require separately authorized operational work.
- The suite is real PostgreSQL evidence for the configured runtime. The migration runbook retains the existing PostgreSQL 12–14 matrix caveat for release CI.
- This report deliberately does not assert correctness for uncommitted concurrent Payment work; P3 needs its own gate and review after its working tree is committed.

## Final-review remediation (2026-07-21)

The final independent review found two behavior defects and one runbook mismatch. Each behavior fix followed a RED-to-GREEN regression sequence:

- **I1 — concurrent idempotency:** the former replay lookup occurred outside the transaction, so two same-key capacity requests could both pass the lookup and the later request failed availability before the unique-key fallback. The live test now holds the exact PostgreSQL transaction advisory lock, starts two real same-user/same-key requests, observes two distinct service backends waiting on `pg_advisory_xact_lock`, then releases the gate. The implementation acquires that transaction-scoped lock and performs the user-scoped replay lookup before availability. Both responses must contain the same booking ID and the capacity aggregate must remain one.
- **I2 — invalid `bookingAt`:** `resolveBookingAtFromPayload` returned `Invalid Date`, and create silently substituted the current time after fetching user/service. The resolver and Zod schema now reject unparseable or impossible calendar values; direct create rejects before any Prisma read.
- **M1 — orphan audit documentation:** the runbook SQL now uses the same `didaugio_codex_migration_%_booking_%` pattern as the read-only audit command.

### Final-review evidence

| Command | Result |
| --- | --- |
| RED `server: node --test test/bookingAvailability.contract.test.js` | exit 1; 13 passed, 2 failed exactly at the new invalid-`bookingAt` schema and no-Prisma-read regressions. |
| RED `server: node --test test/bookingAvailability.integration.test.js` | exit 1; real same-key contention reproduced `BOOKING_CAPACITY_EXCEEDED` before replay. |
| GREEN `server: node --test test/bookingAvailability.contract.test.js` | exit 0; 15 passed, 0 failed. |
| GREEN live run 1 `server: node --test test/bookingAvailability.integration.test.js` | exit 0; 1 passed, 1 expected prerequisite skip; 11.57 s. |
| GREEN live run 2 `server: node --test test/bookingAvailability.integration.test.js` | exit 0; 1 passed, 1 expected prerequisite skip; 12.52 s. |
| `server: npm.cmd run quality:booking` | exit 0; 33 passed, 0 failed, 1 expected prerequisite skip; includes the real advisory-lock regression. |
| `server: npx.cmd prisma validate --schema=prisma/schema.prisma` | exit 0; schema valid. |
| `server: npm.cmd run audit:booking:orphans` | exit 0; `owned_booking_audit_databases=0`. |
| `app: npm.cmd run test:booking` | exit 0; 5 passed. |
| targeted app ESLint command from the prior gate | exit 0; no diagnostics. |

## Second final-review remediation (2026-07-21)

- Replaced the schema's global booking idempotency uniqueness with a nullable composite unique index on `(user_id, idempotency_key)`. Forward migration `20260721210000_scope_booking_idempotency_per_user` validates the table, columns, duplicate tenant keys, both exact index definitions, health flags, key order, and access method before it creates the composite index and removes the validated historical index in one transaction. The migration is idempotent and rejects same-name incompatible legacy or composite indexes atomically.
- P2002 recognition now accepts only the tenant composite fields or exact composite index name. Same-user lock/replay remains user-scoped; a real two-user same-key race proves two independent booking IDs and correct returned user ownership.
- Direct string `bookingAt` now requires `Z` or a numeric offset. Zone-less input is rejected by both resolver and schema before Prisma access. Explicit `+07:00` input maps to the same UTC instant under `TZ=UTC` and `TZ=America/New_York`; the Vietnam-local `useDate`/`useTime` path is unchanged.

### Second final-review evidence

| Command | Result |
| --- | --- |
| RED focused contract/migration command | exit 1; 18 passed, 5 expected failures, 2 migration tests skipped because the forward migration was intentionally absent. Failures covered zone-less schema/resolver/direct-create, composite P2002 target, and missing migration. |
| RED live booking integration | exit 1; global `idempotency_key` uniqueness allowed only one of two users to succeed (`1 !== 2`). |
| GREEN focused contract/migration command | exit 0; 25 passed, 0 failed/skipped, including idempotent and fail-closed migration execution on owned databases. |
| GREEN live run 1 | exit 0; 1 live pass, 1 expected prerequisite skip; 12.16 s. |
| GREEN live run 2 | exit 0; 1 live pass, 1 expected prerequisite skip; 13.05 s. |
| `server: npm.cmd run quality:booking` | exit 0; 37 passed, 0 failed, 1 expected prerequisite skip; 10.87 s. |
| `server: npx.cmd prisma validate --schema=prisma/schema.prisma` | exit 0; schema valid. |
| First updated migration aggregate | all 19 migrations applied and new migration tests passed, but aggregate exited 1 at 49/50 because the exact gate-wiring contract still named the former three-file command. No schema or migration execution failed. |
| Targeted migration wiring rerun | exit 0; 27 passed. |
| Final `server: npm.cmd run quality:migrations` | exit 0; all 19 migrations applied on a new owned clean database; 50 passed, 0 failed/skipped; 124.50 s test duration. |
| `server: npm.cmd run audit:booking:orphans` | exit 0; `owned_booking_audit_databases=0`. |
