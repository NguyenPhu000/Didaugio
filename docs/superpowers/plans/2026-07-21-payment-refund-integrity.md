# Payment and Refund Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure callbacks, manual collections, financial ledgers, and refunds can only move money that exactly matches a stored payment obligation, with idempotent receipts and auditable outcomes.

**Architecture:** Keep `Payment.amount/currency/transactionRef` as the immutable obligation. Normalize authenticated gateway callbacks through a pure policy before any transaction mutation. Record every successful collection as an immutable `PaymentReceipt` and every refund as a stateful `RefundAttempt`; derive paid/refunded status from succeeded rows inside a locked transaction.

**Tech Stack:** Node.js ESM, Prisma 5, PostgreSQL, Node test runner, Express/Zod.

## Global Constraints

- Gateway signature verification precedes database mutation.
- Reference, positive safe-integer amount, currency, outcome, and terminal state are validated before financial transition.
- `Payment.amount` is an immutable obligation after initiation; manual collection never overwrites it.
- Successful receipts cannot cumulatively exceed the obligation.
- Successful refunds cannot cumulatively exceed successful collections.
- Gateway/external transaction identifiers and idempotency keys are unique in their domain.
- Replays return the existing result without duplicating booking state, wallet balance, or ledger entries.
- External gateway calls are never held inside a database transaction.
- Logs and errors omit signatures, credentials, and full raw financial payloads.
- Stable codes include `PAYMENT_AMOUNT_MISMATCH`, `PAYMENT_CURRENCY_MISMATCH`, `PAYMENT_REFERENCE_MISMATCH`, `PAYMENT_ALREADY_FINAL`, `PAYMENT_DUPLICATE_TRANSACTION`, `PAYMENT_OVER_COLLECTION`, and `REFUND_EXCEEDS_COLLECTED`.

---

### Task 1: Gateway callback obligation policy

**Files:**
- Create: `server/src/services/payment/paymentIntegrity.js`
- Modify: `server/src/services/payment/payment.service.js`
- Modify: `server/src/services/payment/vnpay.service.js`
- Test: `server/test/paymentIntegrity.test.js`
- Test: `server/test/paymentGatewayCallback.contract.test.js`

**Interfaces:**
- Produces: `assertPaymentObligationMatches({ payment, reference, amount, currency })` and stable local error codes.
- Consumes: verified VNPay/MoMo callback fields and locked `Payment` row.

- [ ] **Step 1: Write RED policy and mutation-guard tests**

```js
assert.deepEqual(
  assertPaymentObligationMatches({
    payment: { transactionRef: "DDG1", amount: 120000, currency: "VND" },
    reference: "DDG1",
    amount: 120000,
    currency: "vnd",
  }),
  { reference: "DDG1", amount: 120000, currency: "VND" },
);
```

Add independent failures for missing/wrong reference, fractional/unsafe/non-positive/wrong amount, and wrong/missing currency. Service harnesses must prove mismatch invokes no payment/booking/wallet/ledger/action-log write for VNPay and MoMo; a wrong-amount replay of a paid row is rejected before idempotent acknowledgement.

- [ ] **Step 2: Run RED**

Run: `node --test test/paymentIntegrity.test.js test/paymentGatewayCallback.contract.test.js`

Expected: missing module/guard calls.

- [ ] **Step 3: Implement and wire before terminal-state handling**

VNPay normalization must preserve signed `vnp_CurrCode`; MoMo uses explicit contract currency `VND`. Call the pure assertion immediately after the locked row is loaded and before checking paid/failure/success state.

- [ ] **Step 4: Run GREEN and commit**

Run focused tests and `node --check` for changed services. Commit only Task 1 files.

---

### Task 2: Receipt/refund-attempt schema and forward migration

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/20260721200000_add_payment_receipts_refund_attempts/migration.sql`
- Create: `server/test/paymentMigration.contract.test.js`
- Create: `server/test/paymentMigration.integration.test.js`

**Interfaces:**
- Produces Prisma models `PaymentReceipt` and `RefundAttempt` with immutable amount/currency/source/idempotency fields.
- Consumes existing `Payment`, `User`, and historical paid/refunded fields.

- [ ] **Step 1: Write RED migration contracts**

Require:

```prisma
model PaymentReceipt {
  id                    Int      @id @default(autoincrement())
  paymentId             Int      @map("payment_id")
  source                String
  gateway               String?
  amount                Int
  currency              String   @default("VND")
  externalTransactionId String?  @map("external_transaction_id")
  idempotencyKey        String   @unique @map("idempotency_key")
  actorUserId           Int?     @map("actor_user_id")
  status                String
  receivedAt            DateTime @default(now()) @map("received_at")
  metadata              Json?
  payment               Payment  @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  actor                 User?    @relation("PaymentReceiptActor", fields: [actorUserId], references: [id], onDelete: SetNull)

  @@unique([gateway, externalTransactionId])
  @@index([paymentId, status])
  @@map("payment_receipts")
}
```

Create this explicit refund model and its `Payment`/`User` relations:

```prisma
model RefundAttempt {
  id               Int       @id @default(autoincrement())
  paymentId        Int       @map("payment_id")
  source           String
  gateway          String?
  amount           Int
  currency         String    @default("VND")
  externalRefundId String?   @map("external_refund_id")
  idempotencyKey   String    @unique @map("idempotency_key")
  actorUserId      Int?      @map("actor_user_id")
  status           String
  reason           String?
  requestedAt      DateTime  @default(now()) @map("requested_at")
  completedAt      DateTime? @map("completed_at")
  metadata         Json?
  payment          Payment   @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  actor            User?     @relation("RefundAttemptActor", fields: [actorUserId], references: [id], onDelete: SetNull)

  @@unique([gateway, externalRefundId])
  @@index([paymentId, status])
  @@map("refund_attempts")
}
```

Add `receipts PaymentReceipt[]` and `refundAttempts RefundAttempt[]` to `Payment`. Add `paymentReceiptsActed PaymentReceipt[] @relation("PaymentReceiptActor")` and `refundAttemptsActed RefundAttempt[] @relation("RefundAttemptActor")` to `User`.

- [ ] **Step 2: Add safe forward migration**

Create tables/indexes/foreign keys, then backfill one deterministic `legacy_payment_<id>` succeeded receipt for historical paid/partially-refunded/fully-refunded payments. Backfill deterministic succeeded refund attempts for positive historical `refund_amount`. Preflight invalid amount/currency/ranges and reject rather than inventing data.

- [ ] **Step 3: Run live disposable-database integration**

Cover clean deploy, historical backfill, idempotence, duplicate external IDs, and atomic refusal when refund exceeds collection. Reuse Phase 1 owned audit helpers.

- [ ] **Step 4: Commit**

Run Prisma validate and migration integrity gate; commit only schema/migration/tests.

---

### Task 3: Canonical collection transition and manual receipts

**Files:**
- Create: `server/src/services/payment/paymentTransition.service.js`
- Modify: `server/src/services/payment/payment.service.js`
- Modify: `server/src/services/booking/booking.service.js`
- Modify: `server/src/models/schemas/booking/booking.schema.js`
- Test: `server/test/paymentTransition.test.js`
- Test: `server/test/manualPayment.integration.test.js`

**Interfaces:**
- Consumes: locked Payment obligation and a normalized collection command.
- Produces: `recordSucceededReceipt(tx, command)` returning cumulative collected/outstanding/status.

- [ ] **Step 1: RED tests for cumulative reconciliation**

Cover positive amount, actor/reason/reference, partial receipt remains unpaid, exact cumulative receipt marks paid once, over-collection rejects, duplicate idempotency/external transaction returns existing result, and concurrent last-outstanding receipts produce exactly one success.

- [ ] **Step 2: Implement locked transition**

Lock payment by ID/reference. Insert/replay receipt, sum only succeeded receipts, compare against immutable obligation, and transition Payment/Booking/ledger exactly once when cumulative amount equals obligation. `markPaid` requires explicit amount, method, idempotency key, and reason; it must never default to final price or overwrite `Payment.amount`.

- [ ] **Step 3: Route gateway callbacks through the transition**

Replace duplicate VNPay/MoMo/SePay ledger mutations with the canonical transition while retaining gateway-specific response adapters.

- [ ] **Step 4: Verify and commit**

Run focused unit/live concurrency tests and existing payment/booking tests. Commit only Task 3 files.

---

### Task 4: Stateful refund orchestration

**Files:**
- Create: `server/src/services/payment/refundTransition.service.js`
- Modify: `server/src/services/payment/payment.service.js`
- Modify: `server/src/services/booking/booking.service.js`
- Modify: `server/src/models/schemas/booking/booking.schema.js`
- Test: `server/test/refundTransition.test.js`
- Test: `server/test/refundTransition.integration.test.js`

**Interfaces:**
- Produces: `createRefundIntent`, `succeedRefundAttempt`, and `failRefundAttempt`.
- Consumes: succeeded receipts/refunds, source (`manual` or gateway), actor, idempotency key, and external result.

- [ ] **Step 1: RED state-machine tests**

Cover pending intent writes no wallet/ledger debit; external failure records failed only; success atomically debits the correct frozen/settled bucket; replay does not double-debit; partial then full refund; concurrent requests cannot exceed collected total; manual path cannot claim a gateway source.

- [ ] **Step 2: Implement two-transaction orchestration**

Commit pending intent, release DB transaction, call gateway adapter, then lock/finalize in a second transaction. Manual refunds use the same finalizer with source `manual` and mandatory actor/reason but no fake gateway result.

- [ ] **Step 3: Replace legacy direct refund arithmetic**

Remove direct mutation based only on `Payment.refundAmount`; derive totals from succeeded attempts and update compatibility summary fields from canonical totals.

- [ ] **Step 4: Verify and commit**

Run unit/live tests twice for concurrency and replay stability. Commit only Task 4 files.

---

### Task 5: Payment API contracts, quality gate, and runbook

**Files:**
- Modify: `server/src/routes/payment/payment.route.js`
- Modify: `server/src/controllers/payment/payment.controller.js`
- Modify: `server/package.json`
- Create: `server/docs/payment-integrity-runbook.md`
- Create: `server/test/paymentRoute.contract.test.js`
- Modify: `app/src/api/endpoints.js`
- Modify: `app/src/modules/booking/api/paymentApi.js`
- Create: `app/src/modules/booking/api/__tests__/paymentApi.contract.test.js`

**Interfaces:**
- Produces authenticated `GET /api/payments/by-booking/:bookingId` with ownership/admin policy.
- Produces `quality:payments` aggregate script.

- [ ] **Step 1: RED route-contract tests**

Require the mobile-referenced by-booking route, correct ownership/permission checks, stable financial conflict codes, and no public mutation endpoint.

- [ ] **Step 2: Implement route and aggregate gate**

Add `quality:payments` for policy, callback, migration, manual receipt, refund, concurrency, and route tests. Ensure live tests fail clearly rather than silently skip when database credentials are absent.

- [ ] **Step 3: Write runbook**

Document gateway secret prerequisites, reconciliation queries based on receipts/refund attempts, replay handling, mismatch monitoring, manual receipt/refund separation, and production migration backup/approval. Never include real payloads or secrets.

- [ ] **Step 4: Phase verification and review**

Run payment gate, migration gate, Prisma validate, server syntax/route contracts, cleanup evidence, and independent whole-phase review. Fix every Critical/Important finding before completion.

## Phase Completion Gate

- Wrong reference/amount/currency callbacks cause zero financial mutation.
- Matching gateway replays are idempotent; wrong-obligation replays are rejected.
- Partial manual collection stays unpaid; exact cumulative collection pays once; excess rejects.
- Failed refunds do not alter ledger/wallets; succeeded replay never double-refunds.
- Total succeeded refunds never exceed succeeded collections.
- Payment obligation fields remain immutable after initiation.
- Focused/live gates pass and independent review reports 0 Critical/Important.
