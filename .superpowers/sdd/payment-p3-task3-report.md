# P3 Task 3 report — canonical collection transition

## Scope

- Added `paymentTransition.service.js` as the only path that writes succeeded receipts and performs the paid booking/ledger transition.
- Routed VNPay, MoMo, and SePay success callbacks through it without changing their response adapters or prior signature/obligation checks.
- Replaced manual `markPaid` amount overwrites/defaults with an explicit receipt command and immutable payment obligation.
- Tightened the manual payment Zod contract: method, external reference, amount, idempotency key, and reason are required.

## RED → GREEN evidence

1. `node --test test/paymentTransition.test.js` initially failed because `paymentTransition.service.js` was absent.
2. `node --test test/manualPayment.integration.test.js` initially failed because `markPaidSchema` accepted missing collection fields.
3. GREEN: focused callback, obligation, manual, transition, and owned-DB concurrency suite passed **27/27**.

## Live owned-database evidence

`paymentTransition.test.js` creates a fresh audit-named database, deploys migrations there, runs two simultaneous final-receipt transactions, verifies one paid transition/one rejection, two receipts total including the partial receipt, two ledger entries only, immutable obligation, and paid booking status. The audit database is dropped in `finally`; it never points the Prisma client at the application database.

## Commands

```text
node --test test/paymentCallbackObligation.test.js test/vnpayCallbackNormalization.test.js test/paymentCallbackHandler.test.js test/paymentTransition.test.js test/manualPayment.integration.test.js
# 27 pass, 0 fail
npm.cmd exec prisma validate -- --schema=prisma/schema.prisma
# valid
node --check src/services/payment/paymentTransition.service.js
node --check src/services/payment/payment.service.js
node --check src/services/booking/booking.service.js
```

## Note

Repository-wide `git diff --check` still reports an existing unrelated trailing blank line in `.gitignore`; scoped Task 3 files have no whitespace errors.
