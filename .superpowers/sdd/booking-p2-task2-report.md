# P2 Booking Task 2 Report

## Scope

- Added transactional resource allocation, locking, validation, overlap isolation, and canonical availability values.
- Wired create, confirm, reschedule, quick approval, and auto-approval availability calls to carry a booking resource ID.
- Create and reschedule now persist the command's canonical resource and interval values.
- Preserved resource values during approvals, and capacity bookings persist canonical null resource/timestamps.

## TDD evidence

- RED: 4 runs / 9 expected failing assertions.
  - Missing resource, invalid resource state/service/place, resource capacity, resource filter/deleted filter/canonical interval, and capacity canonicalization: 5 failures.
  - Schema resource ID: 1 failure.
  - Create persistence and reschedule propagation: 2 failures.
  - Resource blocked-date preservation: 1 failure.
- GREEN: all contract tests pass (10/10); the create-level invalid-calendar-before-Prisma-read regression passed from the approved Task 1 time-input wiring.

## Verification

- `node --test test/bookingPolicy.test.js test/bookingTimeSlot.test.js test/bookingAvailability.contract.test.js` — 20 passing.
- Every focused booking test discovered by `rg --files server/test | rg -i booking` — the same 20 passing tests.
- `node --check` passed for all four changed production files.
- `git diff --check -- <scoped booking files>` passed.

## Caller audit

Reviewed every `checkAvailability(` caller: create, confirm, reschedule, quickApproveBooking, and autoApproveIfMatchRules. Existing resource bookings pass their `resourceId`; resource values are not cleared by either approval path.

## Concerns

- The shared worktree contains unrelated dirty user files, including `.gitignore`; they were not staged or modified by this task.

## Follow-up: blocked-date Vietnam calendar integrity

- Reviewer-found root cause: resource and capacity availability derived blocked-date lookup keys by truncating `bookingAt` to UTC midnight, while `BusinessBlockedDate` stores the Vietnam calendar date via `toUseDateOnly` (noon UTC).
- RED: 1 run / 2 expected failures, both showing `2026-07-21T00:00:00.000Z` instead of the Vietnam date key `2026-07-22T12:00:00.000Z` for a local `00:30` booking.
- GREEN: both resource and capacity branches now use `toUseDateOnly(bookingAt)`; 22 focused booking tests pass and `node --check src/services/booking/bookingAvailability.service.js` passes.

## Follow-up: public availability blocked-date integrity

- Reviewer-found root cause: `getAvailableSlots` used a UTC-midnight date key even though the public booking route exposes Vietnam calendar availability and blocked dates persist through `toUseDateOnly`.
- RED: 1 run / 1 expected failure, showing the public lookup key at `2026-07-22T00:00:00.000Z` rather than the canonical `2026-07-22T12:00:00.000Z`.
- GREEN: public availability now uses `toUseDateOnly(dateStr)` and returns its established `{ available: false, reason: "BLOCKED_DATE", slots: [] }` contract for a Vietnam-local blocked date; 23 focused booking tests pass.
