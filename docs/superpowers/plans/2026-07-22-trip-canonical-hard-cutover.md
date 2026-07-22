# Trip Canonical Hard Cutover Implementation Plan

1. Add failing schema/service integration tests for canonical TripPlan CRUD, sharing, saves, migration idempotency, create idempotency, and execution version conflicts.
2. Expand Prisma schema with canonical relations, legacy map, client request key, and execution operation ledger; generate migration.
3. Rewrite offline backfill to populate TripPlan/TripStop and remap saves/shares/events deterministically; add validation and dry-run support.
4. Remove request-time shadow resolution and rewrite Trip services/controllers around TripPlan plus centralized access capabilities.
5. Update mobile/web endpoint contracts, fix share deletion, and replace destination aliases with stop endpoints.
6. Add durable mobile create mapping and Active Trip outbox/version reconciliation.
7. Run focused tests, full Trip integration gate, Prisma migration gate on disposable PostgreSQL, and legacy-reference static checks.
