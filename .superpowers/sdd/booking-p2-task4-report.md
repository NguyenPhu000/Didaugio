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

## Review fix: deterministic concurrency proof

- Reviewer finding: the original `Promise.allSettled` assertions proved final outcomes but did not prove both real service requests overlapped at a database lock boundary.
- RED: added a required proof ledger for the resource and capacity races; the live suite failed with `actual []`, `expected ["resource", "capacity"]`.
- GREEN: the test now opens an independent PostgreSQL blocker transaction before launching the two real booking-service requests. The resource race holds `place_resources`, so one application backend waits there while the other waits on the first transaction's `business_services` lock. The capacity race holds `business_services`, so both application backends wait on that service lock.
- `pg_stat_activity` is polled with a 15-second bound and scoped by the owned database plus a test-only `application_name`. Each race asserts at least two distinct waiting PIDs, and asserts that their active queries name the expected lock tables.
- The gate transaction is committed or rolled back in `finally`; both request promises are settled even if lock observation fails. The Prisma client is now also disconnected before owned-database teardown on callback failure.
- Post-fix live suite passed twice: each run 1 pass, 1 expected environment guard skip, 0 failures.
- Post-fix focused P2 suite passed: 31 passed, 1 expected environment guard skip, 0 failed.

## Approved-review minor cleanup hardening

- RED: injected a cleanup implementation that physically drops the owned audit database and then throws while the callback also throws. The previous lifecycle returned only the primary error, so the required `AggregateError` assertion failed.
- GREEN: lifecycle cleanup now has a nested `try/finally`; the admin client close runs even when database drop reports failure. Primary, drop, and close failures are retained, with primary plus cleanup failures returned as one `AggregateError` instead of masking either cause.
- Live evidence asserts the owned database was physically dropped, the admin close callback ran exactly once, and the aggregate contains both intentional error messages in order.
- Verification: syntax check passed; relevant live suite passed with 1 pass, 1 expected environment guard skip, 0 failures.
