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
