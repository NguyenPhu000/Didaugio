# P3 Task 3 report — canonical collection transition

## Scope

- Added `paymentTransition.service.js` as the only path that writes succeeded receipts and performs the paid booking/ledger transition.
- Routed VNPay, MoMo, and SePay success callbacks through it without changing their response adapters or prior signature/obligation checks.
- Replaced manual `markPaid` amount overwrites/defaults with an explicit receipt command and immutable payment obligation.
- Tightened the manual payment Zod contract: method, external reference, amount, idempotency key, and reason are required.

## RED → GREEN evidence

1. `node --test test/paymentTransition.test.js` initially failed because `paymentTransition.service.js` was absent.
2. `node --test test/manualPayment.integration.test.js` initially failed because `markPaidSchema` accepted missing collection fields.
3. GREEN: focused callback, obligation, manual, transition, and owned-DB concurrency suite passed **28/28**.

## Live owned-database evidence

`paymentTransition.test.js` creates a fresh audit-named database, deploys migrations there, runs two simultaneous final-receipt transactions, verifies one paid transition/one rejection, two receipts total including the partial receipt, two ledger entries only, immutable obligation, and paid booking status. The audit database is dropped in `finally`; it never points the Prisma client at the application database.

`manualPayment.integration.test.js` independently creates another owned audit database and calls the real `markPaid` service for a partial receipt, final receipt, and replay. It proves the stored obligation remains `100000`, only two receipts exist, and the ledger is written exactly once.

## Commands

```text
node --test test/paymentCallbackObligation.test.js test/vnpayCallbackNormalization.test.js test/paymentCallbackHandler.test.js test/paymentTransition.test.js test/manualPayment.integration.test.js
# 28 pass, 0 fail
npm.cmd exec prisma validate -- --schema=prisma/schema.prisma
# valid
node --check src/services/payment/paymentTransition.service.js
node --check src/services/payment/payment.service.js
node --check src/services/booking/booking.service.js
```

## Note

Repository-wide `git diff --check` still reports an existing unrelated trailing blank line in `.gitignore`; scoped Task 3 files have no whitespace errors.

## Review-fix follow-up

- Replaced the reachable `/api/payments/sepay-webhook` bank collection's direct payment/booking/ledger mutation path with `recordSucceededReceipt`.
- The bank handler now verifies HMAC before every database call. Invalid signatures are logged only afterwards with the existing sanitized webhook-log shape; neither raw body nor signature is stored.
- Added a dependency-injected production handler factory and tests for verify-before-log, sanitized invalid-signature logging, mismatch zero mutation, one canonical success transition, and replay.
- Receipt replay identity now compares a stable canonical fingerprint including amount, currency, source/gateway, method, external reference, actor, reason, and stable metadata. Conflicting reuse fails with `PAYMENT_DUPLICATE_TRANSACTION`; volatile gateway payment-data is deliberately excluded.
- Final combined callback, bank-handler, transition/live, manual, and obligation gate passes **32/32**; Prisma validation and changed-file syntax checks pass.
