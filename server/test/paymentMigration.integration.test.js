import "dotenv/config";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Client } from "pg";

import {
  buildAdminDatabaseUrl,
  buildAuditDatabaseName,
  buildDatabaseUrl,
  buildPgClientConfig,
  dropOwnedAuditDatabase,
  quoteIdentifier,
} from "../src/scripts/lib/migrationAudit.js";

const migrationSql = await readFile(
  new URL(
    "../prisma/migrations/20260721200000_add_payment_receipts_refund_attempts/migration.sql",
    import.meta.url,
  ),
  "utf8",
);

const sourceUrl = process.env.DATABASE_URL;

async function withAuditDatabase(label, run) {
  assert.ok(sourceUrl, "DATABASE_URL is required for payment migration integration tests");
  const databaseName = buildAuditDatabaseName(label);
  const auditUrl = buildDatabaseUrl(sourceUrl, databaseName);
  const admin = new Client(buildPgClientConfig(buildAdminDatabaseUrl(sourceUrl)));
  let ownsDatabase = false;
  let audit;
  try {
    await admin.connect();
    await admin.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    ownsDatabase = true;
    audit = new Client(buildPgClientConfig(auditUrl));
    await audit.connect();
    return await run(audit, databaseName);
  } finally {
    await audit?.end().catch(() => undefined);
    if (ownsDatabase) await dropOwnedAuditDatabase(admin, databaseName);
    await admin.end().catch(() => undefined);
  }
}

async function createLegacyPaymentTables(client) {
  await client.query(`
    CREATE TABLE "users" ("id" INTEGER PRIMARY KEY);
    CREATE TABLE "bookings" (
      "id" INTEGER PRIMARY KEY,
      "final_price" INTEGER NOT NULL,
      "payment_status" TEXT NOT NULL DEFAULT 'unpaid'
    );
    CREATE TABLE "payments" (
      "id" INTEGER PRIMARY KEY,
      "booking_id" INTEGER NOT NULL UNIQUE,
      "user_id" INTEGER NOT NULL,
      "amount" INTEGER NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'VND',
      "payment_method" TEXT NOT NULL,
      "transaction_id" TEXT,
      "transaction_ref" TEXT NOT NULL UNIQUE,
      "idempotency_key" TEXT NOT NULL UNIQUE,
      "status" TEXT NOT NULL DEFAULT 'unpaid',
      "paid_at" TIMESTAMP(3),
      "refund_amount" INTEGER,
      "refunded_at" TIMESTAMP(3),
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

test("payment migration integration requires an explicit disposable PostgreSQL URL", { skip: Boolean(sourceUrl) }, () => {
  assert.fail("DATABASE_URL is required for payment migration integration tests");
});

test("payment migration keeps all historical backfill mutations inside one transaction", () => {
  const receiptBackfill = migrationSql.indexOf('INSERT INTO "payment_receipts"');
  const obligationCanonicalization = migrationSql.indexOf('UPDATE "payments"');
  const refundBackfill = migrationSql.indexOf('INSERT INTO "refund_attempts"');
  assert.ok(receiptBackfill >= 0);
  assert.ok(obligationCanonicalization > receiptBackfill);
  assert.ok(refundBackfill > obligationCanonicalization);
});

test(
  "backfills paid, partial and refunded legacy payments idempotently and cleans its owned database",
  { skip: !sourceUrl },
  async () => {
    await withAuditDatabase("payment_receipts_backfill", async (client) => {
      await createLegacyPaymentTables(client);
      await client.query('INSERT INTO "users" ("id") VALUES (1)');
      await client.query(`
        INSERT INTO "bookings" ("id", "final_price", "payment_status") VALUES
          (101, 120000, 'paid'), (102, 120000, 'paid'), (103, 120000, 'partially_refunded');
        INSERT INTO "payments" (
          "id", "booking_id", "user_id", "amount", "currency", "payment_method",
          "transaction_id", "transaction_ref", "idempotency_key", "status", "refund_amount"
        ) VALUES
          (201, 101, 1, 120000, 'vnd', 'VNPAY', 'gateway-201', 'ref-201', 'payment-201', 'paid', NULL),
          (202, 102, 1, 50000, 'VND', 'manual', NULL, 'ref-202', 'payment-202', 'paid', NULL),
          (203, 103, 1, 120000, 'VND', 'MOMO', 'gateway-203', 'ref-203', 'payment-203', 'partially_refunded', 30000);
      `);

      await client.query(migrationSql);
      await client.query(migrationSql);

      const payments = await client.query(`
        SELECT "id", "amount", "currency", "status" FROM "payments" ORDER BY "id"
      `);
      assert.deepEqual(payments.rows, [
        { id: 201, amount: 120000, currency: "VND", status: "paid" },
        { id: 202, amount: 120000, currency: "VND", status: "partially_paid" },
        { id: 203, amount: 120000, currency: "VND", status: "partially_refunded" },
      ]);
      const receipts = await client.query(`
        SELECT "payment_id", "amount", "source", "status" FROM "payment_receipts" ORDER BY "payment_id"
      `);
      assert.deepEqual(receipts.rows, [
        { payment_id: 201, amount: 120000, source: "legacy", status: "succeeded" },
        { payment_id: 202, amount: 50000, source: "legacy", status: "succeeded" },
        { payment_id: 203, amount: 120000, source: "legacy", status: "succeeded" },
      ]);
      const refunds = await client.query(`
        SELECT "payment_id", "amount", "source", "status" FROM "refund_attempts" ORDER BY "payment_id"
      `);
      assert.deepEqual(refunds.rows, [
        { payment_id: 203, amount: 30000, source: "legacy", status: "succeeded" },
      ]);
    });
  },
);

test(
  "rejects unsafe legacy overcollection and leaves no partial receipt tables behind",
  { skip: !sourceUrl },
  async () => {
    await withAuditDatabase("payment_receipts_refusal", async (client) => {
      await createLegacyPaymentTables(client);
      await client.query('INSERT INTO "users" ("id") VALUES (1)');
      await client.query('INSERT INTO "bookings" ("id", "final_price") VALUES (101, 100)');
      await client.query(`
        INSERT INTO "payments" (
          "id", "booking_id", "user_id", "amount", "currency", "payment_method",
          "transaction_ref", "idempotency_key", "status"
        ) VALUES (201, 101, 1, 101, 'VND', 'manual', 'ref-201', 'payment-201', 'paid')
      `);
      await assert.rejects(
        client.query(migrationSql),
        /Unsafe payment receipt\/refund backfill/u,
      );
      await client.query("ROLLBACK");
      const relation = await client.query("SELECT to_regclass('public.payment_receipts') AS relation");
      assert.equal(relation.rows[0].relation, null);
    });
  },
);
