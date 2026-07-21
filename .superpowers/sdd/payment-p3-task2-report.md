# P3 Task 2 — Payment receipt/refund attempt schema

## Scope delivered

- Added `PaymentReceipt` and `RefundAttempt` Prisma models with immutable amount, currency, source, idempotency, external gateway-ID uniqueness, payment/status indexes, and named actor relations.
- Added `PAYMENT_STATUS.PARTIALLY_PAID`.
- Added forward-only migration `20260721200000_add_payment_receipts_refund_attempts`.
  - Creates ledger tables, checks, indexes, and scoped foreign keys with catalog guards that reject incompatible same-name indexes/FKs.
  - Preflights invalid historical links, amounts, currencies, over-collections, invalid refunds, and duplicate gateway transaction IDs.
  - Preserves historical collection in deterministic legacy receipts before canonicalizing `payments.amount` to `bookings.final_price`.
  - Backfills deterministic succeeded refund attempts and derives compatibility status from immutable evidence.
- Added contract and owned-disposable-PostgreSQL migration tests.

## TDD evidence

- RED: 2 test files failed as expected because the target migration did not exist (`ENOENT`).
- GREEN: 6 passed, 1 configuration-only skip in the focused invocation. The live owned-DB tests ran using `server/.env` credentials and covered exact payment, partial payment, refund, idempotent rerun, and atomic over-collection rejection.

## Verification

- `node --test test/paymentMigration.contract.test.js test/paymentMigration.integration.test.js` — 6 pass, 1 configuration-only skip.
- `npx.cmd prisma validate --schema=prisma/schema.prisma` — pass.
- `npm.cmd run quality:migrations` — 47/47 pass; all 18 migrations applied to a fresh owned audit database and cleaned up.
- `npx.cmd prisma migrate status --schema=prisma/schema.prisma` — read-only check confirms the application database has pre-existing divergent migration history. No application DB migration was applied.

## Concern

Production/application database rollout remains blocked on reconciling its existing divergent migration history and taking an approved backup; this task intentionally did not mutate it.

## Independent review fix

- RED: 3 new live tests failed for the intended reasons: a positive refund with no succeeded receipt was accepted, a same-name table with missing columns reached a later PostgreSQL error, and a weaker same-name amount check was accepted.
- Fixed refund preflight to compare every positive refund against `COALESCE(SUM(succeeded receipts), 0)`, so zero/no receipt fails atomically.
- Added fail-closed catalog validation for every required column type, nullability, and default; exact primary/check constraints; foreign-key targets/actions; and exact non-partial index definitions.
- Added live disposable-DB coverage for refund without receipt, over-refund, nonpositive amount, missing booking, incompatible table structure, weaker check constraint, wrong FK, wrong index, and duplicate non-null receipt/refund external IDs.
- Focused GREEN after review fix: 14 pass, 1 configuration-only skip. Live tests ran with the local server dotenv credentials.
- Full migration gate after review fix: 47/47 pass on a fresh owned audit database; cleanup completed.

## Second independent review fix

- RED: 4 new live test groups failed for the intended gaps: deferred/`NOT VALID` FK acceptance, invalid/unready index acceptance, conflicting deterministic legacy evidence, and succeeded totals beyond the obligation/collection.
- Replaced textual FK acceptance with exact `pg_constraint`/`pg_attribute` validation of source and target keys, match type, update/delete actions, validation, and non-deferrable state.
- Replaced textual index acceptance with exact `pg_index` validation of relation, ordered keys, uniqueness, key/attribute counts, btree access method, no expression/predicate, and valid/ready/live health flags.
- Deterministic legacy receipt/refund conflicts now fail before and after `ON CONFLICT`; backfill metadata preserves the historical amount used for rerun evidence.
- Existing and post-backfill succeeded receipt totals must not exceed the canonical obligation; succeeded refund totals must not exceed independently aggregated succeeded receipts.
- Added explicit full historical refund coverage and live fixtures for untrusted FK/index state, deterministic evidence mismatch, and excess manual receipt/refund totals.
- Focused GREEN: 18 pass, 1 configuration-only skip. Prisma schema validation passed.
- Full migration gate: 47/47 pass on a fresh owned audit database; cleanup completed.

## Final independent review fix

- RED: missing `partially_paid` legacy receipt evidence and same-name indexes with `DESC`/non-default opclass semantics were both accepted.
- Expected receipt/refund sets now use explicit missing-row assertions around the deterministic inserts. A `partially_paid` payment without its immutable legacy receipt fails atomically because its historical collected amount cannot be reconstructed safely.
- Refunded historical states require positive refund summary data and exact deterministic refund evidence after insertion.
- Index validation now requires the exact normalized `pg_get_indexdef` in addition to catalog keys, uniqueness, access method, predicate/expression absence, and health flags; this rejects sort/null/opclass/collation semantic changes.
- Added Windows-safe line-ending normalization to the migration-history contract reader after the full gate exposed a CRLF-only false failure.
- Focused GREEN: 20 pass, 1 configuration-only skip. Prisma schema validation passed.
- Full migration gate rerun with a sufficient outer timeout: 47/47 pass on a fresh owned audit database; cleanup completed.
