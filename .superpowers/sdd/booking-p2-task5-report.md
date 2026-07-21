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
