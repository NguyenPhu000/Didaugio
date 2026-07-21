# System Hardening to 9/10 — Design Specification

## Goal

Raise the current system from the verified 4.8/10 baseline to an evidence-backed score of at least 9/10 by removing every known P0/P1 defect, protecting the core booking/payment/trip invariants, making database migrations reproducible, and requiring clean end-to-end quality gates for server, web, and mobile.

The score is an audit result, not a release toggle. Work continues until the acceptance evidence supports the score; the score is not rounded up to satisfy the target.

## Scope and delivery strategy

The work is split into independently verifiable hardening phases:

1. Database and migration integrity.
2. Booking availability and resource allocation.
3. Payment, manual collection, webhook, and refund integrity.
4. Trip privacy and Trip-to-TripPlan canonicalisation.
5. Active Trip eventual synchronisation.
6. API contract, RBAC, location-release, and domain-status cleanup.
7. Full verification and final architecture/business audit.

Every phase is backward-compatible at its external boundary until its clients and stored data have been migrated. Destructive schema removal is not part of the first cutover. Legacy data may be read during a bounded compatibility window, but legacy writes must not remain an independent source of truth.

## Confirmed defects covered

### P0/P1

- The committed migration history cannot reproduce the current `Booking` schema on a clean database.
- Resource bookings do not reliably persist or scope overlap checks by `resourceId`.
- Availability and booking creation use different duration/capacity semantics.
- A user can save and later retrieve a private trip by ID without a shared access policy check.
- VNPay and MoMo callbacks can transition a payment without first proving callback amount and currency match the stored obligation.
- Manual payment can mark a booking paid from an arbitrary positive amount instead of reconciling cumulative money received.
- `Trip` and `TripPlan` are competing sources of truth; a GET may create a shadow plan, and canonical mutations do not update legacy data.

### P2/P3 included because they prevent a 9/10 gate

- Active Trip network failures are swallowed without an eventual-sync outbox or conflict rule.
- Client/server payment endpoint contracts contain a missing `by-booking` route.
- The web contains a public booking API with no matching server contract.
- Domain status literals remain duplicated despite central constants.
- System roles are partly advertised as dynamic while IDs/names and hierarchy are fixed in code.
- Multi-province release tests pass assertions but leave a process handle open.
- Core booking, payment, privacy, and migration paths do not have adequate regression coverage.

## Global invariants

### Data

- A clean supported PostgreSQL/PostGIS instance can run all committed migrations without manual schema edits.
- Production uses `prisma migrate deploy`; `db push` is not a production migration mechanism.
- A drift check must distinguish intentionally raw-SQL-managed PostGIS objects from accidental drift.
- Backfill commands are idempotent, resumable, observable, and safe to rerun.
- All new uniqueness/foreign-key constraints are preceded by an audit and deterministic repair/backfill step.

### Booking

- A service with `bookingModel = "resource"` requires a valid active `PlaceResource` belonging to the same service and place.
- A resource booking persists `resourceId`, `startTime`, and `endTime`.
- A resource is unavailable when an active booking satisfies `existing.startTime < requested.endTime` and `existing.endTime > requested.startTime`.
- Cancelled, rejected, expired, and soft-deleted bookings do not consume availability.
- Capacity bookings do not require a resource and use the service capacity for the same interval/date semantics as creation.
- Slot duration is resolved once using `slotDurationMinutes`, then `durationMinutes`, then an explicit domain default. Availability and creation call the same resolver.
- Availability validation and insert execute in one transaction. Concurrency is serialized with a database lock/advisory lock keyed by resource/service and time bucket; an application pre-check alone is insufficient.
- `allowOverbooking` is honoured explicitly. It never becomes true because a field is missing.

### Payment and refund

- Gateway payload authenticity, payment reference, amount, currency, and terminal state are validated before a financial transition.
- Gateway transaction identifiers are unique per gateway. Replayed callbacks return the existing result and never duplicate money or ledger entries.
- Payment amount and booking obligation are immutable after a gateway payment is initiated, except through an explicit audited adjustment flow.
- Manual collection records an individual receipt with actor, amount, method, reference, reason, and timestamp.
- A manual receipt must be positive and no larger than the current outstanding amount.
- Booking/payment becomes paid only when successful receipts equal the required amount; partial receipts remain partial/unpaid according to one canonical status policy.
- Refund requests are stateful: `pending`, `succeeded`, or `failed`. A gateway refund updates the financial ledger only after gateway success.
- Manual refunds use a separate audited path and cannot impersonate a gateway refund.
- Total succeeded refunds cannot exceed total succeeded collections.

### Trip access and canonical data

- `TripPlan` is the canonical writable model.
- Legacy `Trip`/`TripDestination` receive no independent mutations after cutover.
- GET requests never create or migrate records.
- A deterministic `legacyTripId` mapping is stored in a relationally enforceable form, not used as an unindexed JSON lookup for correctness-critical resolution.
- Backfill preserves user ownership, dates, ordering, privacy, share relationships, saved relationships, status, and display identity.
- Trip access is decided by one policy function: owner, public visibility, or an unexpired/non-revoked share grant.
- Save, detail, duplicate, share access, execution session, and mutation endpoints call the same policy with the capability they require.
- Knowing a numeric ID grants no access.

### Active Trip

- Mobile remains local-first for responsiveness.
- Every offline mutation is appended to a durable outbox with a stable operation ID, trip ID, device ID, base server version, payload, and creation time.
- The server applies operation IDs idempotently and rejects stale conflicting versions with `409` plus the current snapshot.
- The client retries on reconnect and foreground, removes only acknowledged operations, and exposes a sync-error state instead of silently losing changes.
- Conflict policy is deterministic: visited stops are merged monotonically; terminal session state wins over active/paused; non-monotonic current-stop changes use server version ordering.

### Authorization and status

- Protected routes fetch the current DB user and evaluate permissions/capabilities, not a role name embedded in a token.
- Built-in roles are explicitly immutable system records. Custom roles may be dynamic but cannot inherit hidden semantics from a matching name.
- Domain state changes pass through transition guards. Service code does not invent status literals outside constants/enums.

### Location releases

- Every administrative location read is scoped to exactly one active dataset release.
- Province/ward identity is unique within a release and cannot cross-link releases.
- Cache keys include release ID and are invalidated on release activation.
- V1 compatibility and V2 canonical traffic are measured until V1 retirement; UI must use the V2 contract before retirement.

## Target components

### Migration verifier

Add a reproducible verification command that:

1. Starts from an empty test database with PostGIS available.
2. Runs `prisma migrate deploy`.
3. Validates Prisma schema and generated client.
4. Runs a controlled drift comparison with an allowlist for raw SQL objects.
5. Fails on missing `Booking`, payment, TripPlan, or location-release columns/constraints.

The current historical migration must not be edited after it has been deployed. A forward-only reconciliation migration adds missing columns, indexes, enums, constraints, and backfill defaults.

### Booking policy and availability engine

Create a focused domain module that owns:

- booking model resolution;
- slot duration and interval construction;
- resource ownership/active validation;
- blocking status selection;
- overlap predicate construction;
- capacity consumption;
- lock key construction.

Both availability endpoints and booking creation consume this module. Controller payload validation remains at the boundary; business validation remains in the domain module.

### Financial transition service

Separate protocol parsing from financial mutation:

- Gateway adapters verify signature and normalise payload to `{ gateway, reference, transactionId, amount, currency, outcome, raw }`.
- A financial transition service loads and locks the payment, checks all invariants, writes the payment/booking/ledger transition atomically, and marks the webhook log processed.
- Manual collection uses the same reconciliation function but a distinct authenticated command and receipt source.
- Refund orchestration creates a pending attempt before external gateway work and completes it idempotently on the result.

External calls are never held inside a long database transaction. The pending intent is committed first, the external call runs, and a second locked transaction finalises the result.

### Trip migration and policy service

- Add an explicit indexed legacy mapping field/table with a uniqueness constraint.
- Backfill legacy trips in stable ID batches and emit counts for created, already migrated, repaired, skipped, and failed records.
- Replace `resolveTripPlan` lazy creation with pure lookup.
- Route legacy IDs through the mapping adapter without writing.
- Move all update/delete/reorder/add/remove/share/save/duplicate behaviour to canonical services.
- Keep response normalisers only at the compatibility boundary.

Legacy tables remain for rollback/read compatibility during the observation window. Their write paths are disabled only after backfill verification proves parity.

### Active Trip sync engine

- Mobile outbox storage is isolated from view hooks.
- A sync coordinator owns enqueue, flush, retry/backoff, conflict handling, and foreground/connectivity triggers.
- Server session commands require `operationId`, `deviceId`, and `baseVersion` and return the authoritative version/snapshot.
- Existing clients without version fields remain accepted during a deprecation window but are recorded in telemetry.

### API contract registry

- Server route contracts and client endpoint builders are tested together for critical booking/payment/trip/location paths.
- The missing payment-by-booking contract is implemented server-side if it is a required client use case; otherwise the client reference is removed. Current mobile fallback use makes implementation the chosen design.
- The unused public web booking call is removed unless a matching authenticated/public use case is proven. No dead endpoint wrapper remains.

## Error semantics

Critical domain failures use stable codes:

- `BOOKING_RESOURCE_REQUIRED`
- `BOOKING_RESOURCE_INVALID`
- `BOOKING_SLOT_CONFLICT`
- `BOOKING_CAPACITY_EXCEEDED`
- `PAYMENT_AMOUNT_MISMATCH`
- `PAYMENT_CURRENCY_MISMATCH`
- `PAYMENT_ALREADY_FINAL`
- `PAYMENT_DUPLICATE_TRANSACTION`
- `PAYMENT_OVER_COLLECTION`
- `REFUND_EXCEEDS_COLLECTED`
- `TRIP_ACCESS_DENIED`
- `TRIP_MIGRATION_REQUIRED`
- `TRIP_SESSION_VERSION_CONFLICT`

Expected domain conflicts return 4xx and are not reported as generic 500s. Logs include correlation/reference IDs but redact secrets, signatures, tokens, and full payment payload credentials.

## Migration and rollout

### Phase A: expand

- Add nullable/new columns, mapping and receipt/refund structures, indexes, and uniqueness constraints that are safe after audit.
- Deploy code capable of reading old and new records.

### Phase B: backfill and verify

- Backfill Booking timestamps/resource consistency where derivable; quarantine ambiguous records instead of inventing a resource.
- Backfill TripPlan mappings and compare counts/ownership/stops/privacy.
- Audit duplicate gateway transaction IDs and location-release identities before adding strict constraints.

### Phase C: switch writes

- Route booking/payment/trip mutations through canonical services.
- Enable session versioning and mobile outbox.
- Monitor conflict, mismatch, callback replay, and legacy-route metrics.

### Phase D: contract

- Make newly required fields non-null only after data and traffic prove readiness.
- Disable legacy Trip write paths.
- Remove compatibility routes only in a later release after zero-use evidence. Physical legacy table removal is a separate approved migration.

## Test design

Every production behaviour change follows RED-GREEN-REFACTOR.

### Migration

- Empty PostGIS database reaches the expected schema.
- Upgrade fixture representing the old Booking table reaches the same schema without data loss.
- Migration deploy is idempotent.
- Drift verifier catches a deliberately omitted managed column while ignoring allowlisted raw PostGIS objects.

### Booking

- Resource model rejects missing, foreign, inactive, and wrong-service resources.
- Successful resource booking persists resource and canonical timestamps.
- Boundary intervals that only touch do not overlap; true intersections do.
- Blocking and non-blocking statuses match policy.
- Two concurrent attempts for the last resource/capacity produce exactly one success unless overbooking is enabled.
- Availability and create return the same result for the same interval.

### Payment/refund

- Wrong amount/currency/reference callbacks cannot alter payment or booking.
- Duplicate webhook and duplicate gateway transaction are idempotent.
- Partial manual collection does not mark paid; exact cumulative collection does; excess is rejected.
- Failed gateway refund leaves financial ledger unchanged; successful replay does not double-refund.

### Trip

- A non-owner cannot detail, save, duplicate, or execute a private trip without a valid share grant.
- Public and shared capabilities match policy exactly.
- Backfill is idempotent and preserves stop ordering and privacy.
- GET performs no writes.
- Legacy and canonical IDs resolve to one canonical plan; all mutations update only that plan.

### Active Trip

- Offline operations survive process restart and flush once.
- Retried operation IDs are idempotent.
- Stale version returns `409`; monotonic visited-stop merge is deterministic.
- Terminal session cannot be accidentally reactivated by a stale device.

### Quality gates

- Server full test command exits 0 and releases all handles.
- App tests and lint exit 0.
- Web tests, lint, and production build exit 0.
- Prisma validate/generate/migrate rehearsal exit 0.
- Critical API contract tests exit 0.

## Observability and audit evidence

Add counters/log fields for booking conflicts, payment amount mismatches, webhook replays, refund outcomes, Trip legacy resolutions, Trip backfill results, session conflicts, location API version traffic, and migration drift failures.

The final review records exact commands, exit codes, test counts, remaining warnings, migration evidence, and a requirement-by-requirement matrix. A missing or indirect proof counts as not complete.

## Score rubric

- Architecture and boundaries: 15 points.
- Data integrity and migrations: 15 points.
- Booking correctness/concurrency: 15 points.
- Payment/refund correctness: 15 points.
- Security/privacy/RBAC: 15 points.
- API/client consistency: 10 points.
- Tests and delivery reliability: 10 points.
- Maintainability/observability: 5 points.

A 9/10 requires at least 90/100 and no open P0/P1. A 10/10 additionally requires production-like load/concurrency evidence, disaster-recovery rehearsal, external gateway sandbox evidence, and operational SLO evidence; code-only checks cannot honestly prove 10/10.

## Non-goals

- Rewriting the entire application or replacing Prisma/Express/React/Expo.
- Deleting production legacy tables in the first hardening release.
- Claiming gateway refund success without a real supported gateway API/sandbox result.
- Treating lint cleanliness as proof of business correctness.
- Changing unrelated visual design or the user's in-progress multi-province UI work.

## Acceptance criteria

- Every confirmed defect in this specification has a regression test and an implemented fix.
- All global invariants are enforced in production code or database constraints where appropriate.
- All quality gates complete with exit code 0 and no hanging process.
- Clean and upgrade-path migration rehearsals both succeed.
- No P0/P1 remains after a fresh review of the entire project.
- The final evidence matrix supports at least 90/100 under the rubric above.
