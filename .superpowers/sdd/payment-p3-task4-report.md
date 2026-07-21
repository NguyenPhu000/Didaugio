# P3 Task 4 — Refund transition report

## Scope

- Added `refundTransition.service.js` with committed pending intents, canonical success/failure finalizers, and replay protection.
- Replaced the public booking/payment refund path; removed the direct `Payment.refundAmount` arithmetic implementation.
- Required refund reason and idempotency key at booking/payment validation boundaries.

## Invariants verified

- Pending and failed attempts have no wallet, ledger, booking, or payment-summary effect.
- Finalization derives collection/refund totals from succeeded receipt/attempt rows under the payment lock.
- Partial/full refunds allocate the original commission cumulatively, avoiding rounding loss.
- Frozen and settled partner balances debit the correct bucket; one `REFUND` ledger effect is written per success.
- Replays are idempotent and conflicting gateway result references fail closed. Audit metadata excludes credential-like fields.

## Final controller evidence

- Protected `/:id/refund/sepay` creates a canonical `SEPAY_BANK` gateway attempt (including stable transfer reference) before the bank transfer; its real SePay refund webhook test finalizes that same attempt without a test preseed.
- Protected `/refunds/recover` takes one attempt ID only and reuses the locked canonical finalizer for pending manual cancellations; exact replay is a no-op.
- Gateway initiation reserves pending plus succeeded refunds under the payment lock. The transfer reference is a bounded deterministic SHA-256-derived value persisted in audited metadata; refund webhooks require an exact stored reference match.
- SePay refund production handler DI contract: 4/4 pass (HMAC before log/DB, mismatch no financial mutation, pending success + replay, conflicting external reference).
- Cancellation production-entry harness: 3/3 pass. `cancel`, `cancelMyBooking`, and `quickRejectBooking` commit the booking outcome, pending attempt, and action log before the injected finalizer failure; the attempt remains pending and no event is emitted.
- Combined payment/refund/cancellation focused suite: 36/36 pass.
- Prisma schema validation: pass. Syntax checks for all changed services: pass.

## Earlier evidence

- RED: `refundTransition.test.js` initially failed with `ERR_MODULE_NOT_FOUND` before production service existed.
- Focused unit: 8/8 pass.
- Live owned disposable PostgreSQL: `refundTransition.integration.test.js` 2/2 pass. Each run creates, migrates, and removes its own audit database; it verifies concurrent 60k/50k finalization ceiling, replay, conservation, plus settled-bucket debit.
- Combined payment/refund focused suite: 15/15 pass.
- `npx.cmd prisma validate --schema=prisma/schema.prisma`: pass.
- Syntax checks for changed services/controller: pass.

## Known operational boundary

Production application database migrations were not applied or reset. The existing migration divergence remains an explicit deployment/runbook decision outside this disposable-database verification.
