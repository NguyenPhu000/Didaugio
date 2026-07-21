# Booking Resource and Availability Integrity Implementation Plan

> **Execution requirement:** Follow RED-GREEN-REFACTOR task by task. Do not change payment or trip behavior in this phase.

**Goal:** Make resource and capacity booking decisions deterministic, persist the selected resource, and guarantee that availability, create, reschedule, approval, and the mobile booking flow enforce the same policy.

**Architecture:** Introduce a pure booking-policy module for model, interval, blocking-status, and overlap decisions. The Prisma-facing availability service owns row locks and database queries, while booking commands consume its normalized decision/result instead of recomputing timestamps. The public availability response exposes active resources and per-resource occupancy; mobile requires a resource choice only for resource-model services and sends that ID unchanged.

**Tech stack:** Node.js ESM, Prisma 5, PostgreSQL, Node test runner, Expo/React Native, Vitest.

---

## Domain invariants

- `bookingModel = "resource"` requires a positive `resourceId`.
- The resource must be active and belong to the same service and place as the booking service.
- Resource bookings persist `resourceId`, `startTime`, and `endTime` from the same interval resolver used by every availability check.
- A resource with a declared capacity rejects a booking quantity above that capacity.
- Occupied duration is `slotDurationMinutes`, then `durationMinutes`, then 60 minutes, plus a non-negative `bufferMinutes`.
- Resource overlap is `existing.startTime < requested.endTime && existing.endTime > requested.startTime` for the same `resourceId`.
- Only non-deleted `pending` and `confirmed` bookings consume availability.
- Capacity bookings consume quantity in the same normalized start-minute bucket used by public availability and create.
- `allowOverbooking` bypasses a capacity conflict deliberately; a missing/undefined value never enables it.
- Availability check and insert/update remain in one transaction. The service row is locked for capacity decisions and the selected resource row is locked for resource decisions.
- `useDate` and `useTime` are Vietnam calendar values. Their conversion to an instant and back must round-trip in `Asia/Ho_Chi_Minh`; they must not be interpreted as UTC wall-clock values.
- Expected conflicts use stable codes: `BOOKING_RESOURCE_REQUIRED`, `BOOKING_RESOURCE_INVALID`, `BOOKING_SLOT_CONFLICT`, and `BOOKING_CAPACITY_EXCEEDED`.

### Task 1: Pure booking policy module

**Files:**
- Create: `server/src/services/booking/bookingPolicy.js`
- Create: `server/test/bookingPolicy.test.js`
- Modify: `server/src/config/messages.js`
- Modify: `server/src/utils/bookingTimeSlot.js`
- Create: `server/test/bookingTimeSlot.test.js`

**Step 1: Write failing policy tests**

Cover:

- duration precedence: slot duration, service duration, default 60;
- negative/null buffer normalizes to zero;
- interval end includes duration plus buffer;
- touching boundaries do not overlap, intersections do;
- blocking statuses are exactly pending/confirmed and require `deletedAt = null`;
- resource-model missing/invalid ID produces the stable resource-required error;
- capacity model ignores an optional resource ID;
- `allowOverbooking` is true only for literal `true`;
- Vietnam `09:00` round-trips as `09:00` and maps to the correct UTC instant rather than `09:00Z`.

Run:

```powershell
cd server
node --test test/bookingPolicy.test.js test/bookingTimeSlot.test.js
```

Expected RED: module/exports do not exist.

**Step 2: Implement the pure module**

Export focused functions such as:

```js
resolveBookingModel(service)
resolveOccupiedInterval(service, bookingAt)
intervalsOverlap(left, right)
normalizeRequestedResourceId(service, resourceId)
buildBlockingBookingWhere({ serviceId, resourceId, startTime, endTime, excludeBookingId })
```

Keep Prisma calls out of this file. Add the four error-code constants centrally. Repair the date/time helper with an explicit Vietnam-calendar conversion and make invalid dates/times fail instead of silently rolling over.

**Step 3: Verify and commit**

Run the focused test and `node --check` on the module. Commit only Task 1 files.

---

### Task 2: Transactional server availability and booking commands

**Files:**
- Modify: `server/src/services/booking/bookingAvailability.service.js`
- Modify: `server/src/services/booking/booking.service.js`
- Modify: `server/src/services/booking/bookingSchedule.service.js`
- Modify: `server/src/models/schemas/booking/booking.schema.js`
- Create: `server/test/bookingAvailability.contract.test.js`

**Step 1: Add failing contract tests**

Assert that:

- create schema accepts a positive `resourceId`;
- resource create passes `resourceId` into availability and persists it;
- overlap filters on `resourceId`, active statuses, and `deletedAt: null`;
- resource validation checks service ID, place ID, and active status;
- resource validation enforces declared resource capacity against requested quantity;
- resource row locking is inside the same transaction before overlap read;
- create, reschedule, quick approve, confirm, and automatic approval pass the existing booking's resource ID;
- all resource timestamp writes consume the shared interval resolver rather than local duration arithmetic;
- capacity and resource conflicts map to their stable error codes.

Run:

```powershell
cd server
node --test test/bookingPolicy.test.js test/bookingAvailability.contract.test.js
```

Expected RED: missing payload, filters, locks, and shared calls.

**Step 2: Implement resource validation and locking**

For a resource booking:

1. normalize and require `resourceId`;
2. lock the selected `place_resources` row with `FOR UPDATE`;
3. load it and reject missing, non-active, wrong-service, or wrong-place records;
4. calculate the canonical interval once;
5. query overlaps using the selected resource, active statuses, non-deleted rows, and optional excluded booking;
6. return the normalized interval/resource to the command.

For capacity booking, lock the service row, count only the normalized start-minute bucket, and honor overbooking only when explicitly enabled.

**Step 3: Route all commands through the same result**

- `create` persists the normalized resource and timestamps.
- reschedule retains and validates the existing resource; it does not silently clear it.
- quick/normal approval uses the existing resource.
- non-resource bookings persist `resourceId/startTime/endTime = null`.
- idempotent create returns the prior booking before consuming a second resource decision.

**Step 4: Verify and commit**

Run the two focused files plus the existing booking state/schedule tests discovered by `rg --files server/test | rg 'booking'`. Do not run unrelated full-suite tests yet.

---

### Task 3: Public availability contract and mobile resource selection

**Files:**
- Modify: `server/src/services/booking/bookingAvailability.service.js`
- Modify: `server/src/routes/booking/bookingPublic.route.js`
- Modify: `app/src/modules/booking/hooks/useServiceAvailability.js`
- Modify: `app/src/modules/booking/api/bookingApi.js`
- Modify: `app/app/booking/[placeId].jsx`
- Create: `app/src/modules/booking/utils/resourceAvailability.js`
- Create: `app/src/modules/booking/utils/__tests__/resourceAvailability.test.js`
- Modify: relevant `app/src/i18n/locales/*.json` files discovered before implementation
- Create: `server/test/bookingAvailabilityRoute.contract.test.js`

**Step 1: Define the response contract with failing tests**

Resource response:

```js
{
  bookingModel: "resource",
  resources: [
    { id, name, code, resourceType, capacity, bookedSlots: [{ startTime, endTime }] }
  ],
  slotDurationMinutes,
  bufferMinutes
}
```

Only active resources assigned to the service/place are returned. Capacity response keeps its existing slot shape but uses the same normalized start bucket as create. Each capacity slot exposes a Vietnam-local `time` key plus an ISO instant; mobile matches the local key instead of searching an ISO string for a wall-clock substring. Route parameters and date validation must return stable 400 errors for invalid service/date values.

Mobile pure-helper tests cover resource availability, boundary touching, selected-resource reset after service changes, and payload inclusion.

**Step 2: Implement server response and mobile selection**

- Add resource selection state visible only for resource-model services.
- Reset selection when service changes or a resource disappears from refreshed availability.
- Disable step progression/submission until a currently active/available resource is selected.
- Compute time availability against only the selected resource.
- Send `resourceId` in the create payload and display the selected resource in the confirmation summary.
- Keep capacity UI behavior unchanged.

Extract the resource picker/helper rather than growing the already-large route screen further where practical.

**Step 3: Verify and commit**

Run:

```powershell
cd server
node --test test/bookingAvailabilityRoute.contract.test.js

cd ../app
npx vitest run src/modules/booking/utils/__tests__/resourceAvailability.test.js
npx eslint "app/booking/[placeId].jsx" src/modules/booking
```

Commit only Task 3 files.

---

### Task 4: Real PostgreSQL concurrency and integrity integration tests

**Files:**
- Create: `server/test/bookingAvailability.integration.test.js`
- Reuse: `server/src/scripts/lib/migrationAudit.js`
- Modify production files only if the live RED test proves a real defect

**Step 1: Build a prefix-safe disposable database fixture**

Reuse the migration-audit name validation, bounded clients, secret-safe URLs, and unconditional cleanup. Apply the committed migrations; seed only the minimum user/business/place/service/resource rows.

**Step 2: Add live cases**

- missing/foreign/inactive/wrong-service resource is rejected;
- two different resources can book the same interval;
- touching intervals both succeed;
- true overlap on one resource produces one success and one stable conflict;
- cancelled/rejected/expired/deleted rows do not block;
- two concurrent last-capacity requests produce exactly one success;
- explicit overbooking permits both;
- reschedule detects conflict and rolls back without changing the original timestamps/resource;
- idempotency replay returns one booking and consumes capacity once.

Assert every temporary database is removed on pass and intentional failure.

**Step 3: Verify and commit**

Run the live file twice to expose timing flakiness, then run all Phase 2 focused server tests. Commit only integration/test-driven fixes.

---

### Task 5: Phase quality gate, runbook, and independent review

**Files:**
- Modify: `server/package.json`
- Create: `server/docs/booking-integrity-runbook.md`
- Modify: `app/package.json` only if a focused booking script is useful

**Step 1: Add aggregate gates**

Add a server script that runs booking policy, contract, route, and live integration tests. Add a focused mobile booking test script without replacing existing tests.

**Step 2: Document operations**

Document resource setup prerequisites, conflict/error codes, capacity/overbooking semantics, safe concurrency rehearsal, rollback expectations, and observability fields. Do not document manual database edits as a normal recovery path.

**Step 3: Full phase verification**

Run:

- server booking aggregate gate;
- mobile focused booking tests and lint;
- Prisma validate;
- migration integrity gate from Phase 1;
- explicit disposable-database cleanup count;
- `git diff --check` and a scoped change audit.

**Step 4: Independent review**

Require review of resource ownership, interval/buffer consistency, all mutation callers, transaction/lock ordering, idempotency, public/mobile response parity, and concurrency test quality. Fix every Critical/Important issue before marking Phase 2 complete.

## Phase completion gate

- Missing/invalid resources fail with stable 4xx codes.
- Every successful resource booking stores the selected resource and canonical interval.
- Availability, create, reschedule, and approval agree for the same request.
- Different resources do not block one another; the same resource cannot double-book.
- Capacity concurrency is deterministic and `allowOverbooking` is explicit.
- Mobile can select and submit a resource-model booking without hidden/default allocation.
- Focused server/mobile gates pass with no open handle and no disposable database left behind.
- Independent review reports 0 Critical and 0 Important findings.
