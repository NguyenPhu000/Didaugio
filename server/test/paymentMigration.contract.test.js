import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schema = await readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
const migrationSql = await readFile(
  new URL(
    "../prisma/migrations/20260721200000_add_payment_receipts_refund_attempts/migration.sql",
    import.meta.url,
  ),
  "utf8",
);

test("payment receipt and refund attempt Prisma relations have immutable ledger fields", () => {
  assert.match(schema, /model PaymentReceipt\s*\{/u);
  assert.match(schema, /model RefundAttempt\s*\{/u);
  assert.match(schema, /receipts\s+PaymentReceipt\[\]/u);
  assert.match(schema, /refundAttempts\s+RefundAttempt\[\]/u);
  assert.match(schema, /paymentReceiptsActed\s+PaymentReceipt\[\]\s+@relation\("PaymentReceiptActor"\)/u);
  assert.match(schema, /refundAttemptsActed\s+RefundAttempt\[\]\s+@relation\("RefundAttemptActor"\)/u);
  assert.match(schema, /idempotencyKey\s+String\s+@unique\s+@map\("idempotency_key"\)/u);
  assert.match(schema, /@@unique\(\[gateway, externalTransactionId\]\)/u);
  assert.match(schema, /@@unique\(\[gateway, externalRefundId\]\)/u);
  assert.match(schema, /@@index\(\[paymentId, status\]\)/u);
});

test("receipt/refund migration is transactional, non-destructive and preserves collection before obligation canonicalization", () => {
  assert.match(migrationSql, /^BEGIN;/mu);
  assert.match(migrationSql, /COMMIT;\s*$/mu);
  assert.doesNotMatch(migrationSql, /\bDROP\s+(?:TABLE|COLUMN|DATABASE)\b/iu);
  assert.match(migrationSql, /CREATE TABLE(?: IF NOT EXISTS)? "payment_receipts"/iu);
  assert.match(migrationSql, /CREATE TABLE(?: IF NOT EXISTS)? "refund_attempts"/iu);
  assert.match(migrationSql, /payment_receipts_amount_positive_check/iu);
  assert.match(migrationSql, /payment_receipts_currency_uppercase_check/iu);
  assert.match(migrationSql, /payment_receipts_status_check/iu);
  assert.match(migrationSql, /refund_attempts_amount_positive_check/iu);
  assert.match(migrationSql, /refund_attempts_currency_uppercase_check/iu);
  assert.match(migrationSql, /refund_attempts_status_check/iu);
  assert.match(migrationSql, /legacy_payment_'\s*\|\|\s*p\."id"/iu);
  assert.match(migrationSql, /legacy_refund_'\s*\|\|\s*p\."id"/iu);
  assert.match(migrationSql, /ON CONFLICT \("idempotency_key"\) DO NOTHING/iu);
  assert.match(migrationSql, /"payment_receipts"[\s\S]*?INSERT INTO "payment_receipts"[\s\S]*?UPDATE "payments"/iu);
  assert.match(migrationSql, /CHECK \("amount" > 0\)/iu);
  assert.match(migrationSql, /FOREIGN KEY \("payment_id"\) REFERENCES "payments"\("id"\) ON DELETE CASCADE/iu);
  assert.match(migrationSql, /FOREIGN KEY \("actor_user_id"\) REFERENCES "users"\("id"\) ON DELETE SET NULL/iu);
});

test("migration guards same-name incompatible indexes and foreign keys", () => {
  assert.match(migrationSql, /same-name index .* incompatible definition/iu);
  assert.match(migrationSql, /same-name foreign key .* incompatible definition/iu);
  assert.match(migrationSql, /pg_get_indexdef/iu);
  assert.match(migrationSql, /pg_get_constraintdef/iu);
});
