# P2 Booking Task 3 report

## Scope delivered

- Public availability validates positive service IDs and real Vietnam calendar dates before a service lookup.
- Resource-model availability returns only active exact-service/place resources with their own active, non-deleted occupancy.
- Capacity-model slots now use the same Vietnam-local minute key and canonical UTC bucket used by create-time policy.
- Mobile requires an explicit resource choice, clears it when the service/response changes, checks only that resource and its capacity, and sends `resourceId` only for resource bookings.

## TDD evidence

- RED server: 3 initial contract failures (invalid calendar, resource response shape/occupancy, capacity local bucket); an additional query-isolation RED failure verified removal of the unscoped resource pre-query.
- RED app: 1 missing pure-helper module failure.
- GREEN server: 27/27 focused Node tests passed.
- GREEN app: 4/4 focused Vitest tests passed; scoped ESLint passed.

## Commands

```text
server: node --test test/bookingAvailabilityRoute.contract.test.js test/bookingAvailability.contract.test.js test/bookingPolicy.test.js test/bookingTimeSlot.test.js
app: npx.cmd vitest run src/modules/booking/utils/__tests__/resourceAvailability.test.js
app: npx.cmd eslint "app/booking/[placeId].jsx" src/modules/booking/components/ResourcePicker.jsx src/modules/booking/utils/resourceAvailability.js src/modules/booking/hooks/useServiceAvailability.js src/modules/booking/api/bookingApi.js
```

## Concern

Resource occupancy dates are serialized by Express as ISO strings; the direct service contract uses `Date` instances intentionally so Prisma remains type-safe.

## Review follow-up

- Added regressions for preserving the blocked resource contract, policy duration fallback, literal capacity overbooking, and rejecting non-string/repeated date query values before database access.
- Repaired the public response to use the policy's resolved duration/buffer, preserve resource shape on blocked days, and keep capacity slots selectable only when literal `allowOverbooking` is enabled.
- Focused rerun: server 30/30; app 5/5; scoped ESLint passed.

## Re-review follow-up: Prisma projection wiring

- Removed the duplicated transactional `allowOverbooking` projection and added it to the public availability projection where the flag is consumed.
- The overbooking regression now captures the real `findUnique` arguments and asserts `select.allowOverbooking === true`, so a mock cannot hide a missing Prisma field.
- Focused rerun: server 30/30; app 5/5; scoped ESLint and Node syntax checks passed.
