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
