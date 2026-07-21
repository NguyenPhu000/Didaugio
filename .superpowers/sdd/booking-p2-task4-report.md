# P2 Booking Task 4 report

## Scope

- Added `server/test/bookingAvailability.integration.test.js` only.
- No production code was changed: the approved Task 1–3 booking implementation satisfied every live PostgreSQL case.

## Fixture and database safety

- Reads the source PostgreSQL URL only from `DATABASE_URL`, creates random 128-bit, prefix-safe `didaugio_codex_migration_*` database names via `migrationAudit.js`, and asserts that the audit URL has a different database path.
- Applies migrations from disk through the local Prisma CLI, dynamically imports the real booking service after switching only the test process to that audit URL, and disconnects that Prisma client before database teardown.
- Uses bounded PostgreSQL clients and `dropOwnedAuditDatabase` in `finally`.
- Proves the cleanup path twice in every live execution: one intentional fixture failure and one successful booking suite. The test asserts both owned databases were cleaned and that the intentional failure was recorded as a failure-path cleanup.

## TDD evidence

- RED: 1 initial harness run failed because Windows could not spawn `npx.cmd` through `spawnSync` (`EINVAL`). Replaced only the test harness invocation with the local `node_modules/prisma/build/index.js`; no application behavior was changed.
- GREEN: focused live suite passed twice after the harness correction.
- GREEN: all P2 focused server tests passed: 31 passed, 1 expected environment guard skipped, 0 failed.

## Live cases covered

- Missing, inactive, foreign-place, and wrong-service resource rejection.
- Same-time distinct resources; boundary-touching same-resource intervals; concurrent same-resource conflict.
- Terminal (`cancelled`, `rejected`, `expired`) and soft-deleted rows do not occupy a resource.
- Concurrent final-capacity conflict; literal `allowOverbooking: true` allows both requests.
- Rejected reschedule preserves the original timestamps and resource.
- Replayed idempotency key returns one booking and consumes one capacity unit.

## Commands and results

```text
cd server && node --test test/bookingAvailability.integration.test.js
# run 1 after harness correction: 1 pass, 1 expected skip, 0 failures
# run 2: 1 pass, 1 expected skip, 0 failures

cd server && node --test test/bookingPolicy.test.js test/bookingTimeSlot.test.js test/bookingAvailability.contract.test.js test/bookingAvailabilityRoute.contract.test.js test/bookingAvailability.integration.test.js
# 31 passed, 1 expected DATABASE_URL guard skipped, 0 failed
```

## Concerns

- The project emits the existing informational `Booking rescheduled` log during the focused suite; no errors or cleanup failures were observed.
