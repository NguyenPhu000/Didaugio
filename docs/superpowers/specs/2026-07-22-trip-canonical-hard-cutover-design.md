# Trip Canonical Hard Cutover Design

## Goal

Make `TripPlan` the only runtime Trip aggregate. All IDs accepted and returned by server, mobile, and web are `TripPlan.id`; legacy `Trip` data is migrated offline and never resolved or written in request paths.

## Data model and migration

- Add `TripLegacyMap` with unique `legacyTripId` and unique `tripPlanId` for deterministic, auditable migration.
- Move `SavedTrip`, `TripShare`, and `Event.tripId` relations to `TripPlan`.
- Add `TripPlan.clientRequestId` and unique `(userId, clientRequestId)` for create idempotency.
- Add `TripExecutionOperation` keyed by `(sessionId, operationId)` and use `TripExecutionSession.clientStateVersion` for ordered replay and optimistic concurrency.
- Expand first, run an idempotent offline backfill for trips/destinations/saves/shares/events, validate counts and foreign keys, then contract legacy tables. Runtime never creates shadow plans or looks up JSON metadata.

Because the environment is development-only, the contract can ship in the same development change after a clean disposable-database migration and backfill gate.

## Canonical server behavior

- Keep the public `/profile/trips` namespace, but every resource ID is a `TripPlan.id`.
- CRUD, duplicate, save, share, stop editing, booking links, and active execution all operate on `TripPlan`.
- Delete legacy `destinations` aliases after mobile/web use `stops` endpoints.
- Centralize authorization in `tripAccessPolicy` with explicit capabilities: view, edit, delete, duplicate, save, share, link booking, reorder, and execute.
- Public share-token access is validated against `TripShare`; collaborative authorization does not use JSON `sharedUserIds`.
- Delete share is canonical `DELETE /profile/trips/share/:shareId`; ownership is derived server-side from the share record.

## Client resilience

- Mobile generates and persists `clientRequestId` before an offline create. Server replay returns the existing TripPlan for the same user/key and rejects a conflicting payload.
- Offline queue persists `localId -> serverId` and rewrites dependent queued operations before replay.
- Active Trip mutations enter a durable ordered outbox containing `operationId` and `baseVersion`. Success advances the local version; stale versions return stable HTTP 409 and trigger refetch/reconciliation.

## Validation

- Unit tests cover access capabilities, idempotency, version conflicts, and serializers.
- Integration tests cover create/update/delete/duplicate/save/share/stops/booking/session against PostgreSQL.
- Migration tests start from a legacy fixture, run backfill twice, validate relation counts and IDs, then run the contract migration.
- Static searches must find no runtime `prisma.trip`, `tripDestination`, `legacyTripId`, `migratedFromTripId`, or request-time shadow creation.

## Rollback boundary

Before contract migration, rollback uses the legacy tables plus `TripLegacyMap`. After contract migration, rollback is database restore only; therefore the migration gate must pass before contract is applied outside disposable development databases.
