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

async function assertMigrationRejectsAtomically(client, expected) {
  await assert.rejects(client.query(migrationSql), expected);
  await client.query("ROLLBACK");
  const relation = await client.query("SELECT to_regclass('public.payment_receipts') AS relation");
  assert.equal(relation.rows[0].relation, null);
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
          (101, 120000, 'paid'), (102, 120000, 'paid'), (103, 120000, 'partially_refunded'),
          (104, 120000, 'fully_refunded');
        INSERT INTO "payments" (
          "id", "booking_id", "user_id", "amount", "currency", "payment_method",
          "transaction_id", "transaction_ref", "idempotency_key", "status", "refund_amount"
        ) VALUES
          (201, 101, 1, 120000, 'vnd', 'VNPAY', 'gateway-201', 'ref-201', 'payment-201', 'paid', NULL),
          (202, 102, 1, 50000, 'VND', 'manual', NULL, 'ref-202', 'payment-202', 'paid', NULL),
          (203, 103, 1, 120000, 'VND', 'MOMO', 'gateway-203', 'ref-203', 'payment-203', 'partially_refunded', 30000),
          (204, 104, 1, 120000, 'VND', 'VNPAY', 'gateway-204', 'ref-204', 'payment-204', 'fully_refunded', 120000);
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
        { id: 204, amount: 120000, currency: "VND", status: "fully_refunded" },
      ]);
      const receipts = await client.query(`
        SELECT "payment_id", "amount", "source", "status" FROM "payment_receipts" ORDER BY "payment_id"
      `);
      assert.deepEqual(receipts.rows, [
        { payment_id: 201, amount: 120000, source: "legacy", status: "succeeded" },
        { payment_id: 202, amount: 50000, source: "legacy", status: "succeeded" },
        { payment_id: 203, amount: 120000, source: "legacy", status: "succeeded" },
        { payment_id: 204, amount: 120000, source: "legacy", status: "succeeded" },
      ]);
      const refunds = await client.query(`
        SELECT "payment_id", "amount", "source", "status" FROM "refund_attempts" ORDER BY "payment_id"
      `);
      assert.deepEqual(refunds.rows, [
        { payment_id: 203, amount: 30000, source: "legacy", status: "succeeded" },
        { payment_id: 204, amount: 120000, source: "legacy", status: "succeeded" },
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
      await assertMigrationRejectsAtomically(client, /Unsafe payment receipt\/refund backfill/u);
    });
  },
);

for (const scenario of [
  {
    label: "refund_without_receipt",
    booking: '(101, 100, \'unpaid\')',
    payment: "(201, 101, 1, 100, 'VND', 'manual', 'ref-201', 'payment-201', 'unpaid', 50)",
    expected: /refund exceeds preserved succeeded receipts/iu,
  },
  {
    label: "over_refund",
    booking: "(101, 100, 'paid')",
    payment: "(201, 101, 1, 100, 'VND', 'manual', 'ref-201', 'payment-201', 'paid', 101)",
    expected: /Unsafe payment receipt\/refund backfill/u,
  },
  {
    label: "nonpositive_amount",
    booking: "(101, 100, 'unpaid')",
    payment: "(201, 101, 1, 0, 'VND', 'manual', 'ref-201', 'payment-201', 'unpaid', NULL)",
    expected: /Unsafe payment receipt\/refund backfill/u,
  },
]) {
  test(`rejects ${scenario.label.replaceAll("_", " ")} atomically`, { skip: !sourceUrl }, async () => {
    await withAuditDatabase(`payment_${scenario.label}`, async (client) => {
      await createLegacyPaymentTables(client);
      await client.query('INSERT INTO "users" ("id") VALUES (1)');
      await client.query(`INSERT INTO "bookings" ("id", "final_price", "payment_status") VALUES ${scenario.booking}`);
      await client.query(`
        INSERT INTO "payments" (
          "id", "booking_id", "user_id", "amount", "currency", "payment_method",
          "transaction_ref", "idempotency_key", "status", "refund_amount"
        ) VALUES ${scenario.payment}
      `);
      await assertMigrationRejectsAtomically(client, scenario.expected);
    });
  });
}

test("rejects a missing linked booking atomically", { skip: !sourceUrl }, async () => {
  await withAuditDatabase("payment_missing_booking", async (client) => {
    await createLegacyPaymentTables(client);
    await client.query('INSERT INTO "users" ("id") VALUES (1)');
    await client.query(`
      INSERT INTO "payments" (
        "id", "booking_id", "user_id", "amount", "currency", "payment_method",
        "transaction_ref", "idempotency_key", "status"
      ) VALUES (201, 999, 1, 100, 'VND', 'manual', 'ref-201', 'payment-201', 'unpaid')
    `);
    await assertMigrationRejectsAtomically(client, /Unsafe payment receipt\/refund backfill/u);
  });
});

test("rejects a same-name payment_receipts table with incompatible columns", { skip: !sourceUrl }, async () => {
  await withAuditDatabase("payment_bad_table", async (client) => {
    await createLegacyPaymentTables(client);
    await client.query('CREATE TABLE "payment_receipts" ("id" SERIAL PRIMARY KEY)');
    await assert.rejects(client.query(migrationSql), /incompatible payment_receipts table structure/iu);
    await client.query("ROLLBACK");
  });
});

test("rejects a same-name amount constraint with weaker semantics", { skip: !sourceUrl }, async () => {
  await withAuditDatabase("payment_bad_constraint", async (client) => {
    await createLegacyPaymentTables(client);
    await client.query(migrationSql);
    await client.query('ALTER TABLE "payment_receipts" DROP CONSTRAINT "payment_receipts_amount_positive_check"');
    await client.query('ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_amount_positive_check" CHECK ("amount" >= 0)');
    await assert.rejects(client.query(migrationSql), /same-name constraint .* incompatible definition/iu);
    await client.query("ROLLBACK");
  });
});

test("rejects same-name wrong foreign key and index definitions", { skip: !sourceUrl }, async () => {
  await withAuditDatabase("payment_bad_fk", async (client) => {
    await createLegacyPaymentTables(client);
    await client.query(migrationSql);
    await client.query('ALTER TABLE "payment_receipts" DROP CONSTRAINT "payment_receipts_payment_id_fkey"');
    await client.query('ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "users"("id")');
    await assert.rejects(client.query(migrationSql), /same-name foreign key .* incompatible definition/iu);
    await client.query("ROLLBACK");
  });
  await withAuditDatabase("payment_bad_index", async (client) => {
    await createLegacyPaymentTables(client);
    await client.query(migrationSql);
    await client.query('DROP INDEX "payment_receipts_payment_id_status_idx"');
    await client.query('CREATE INDEX "payment_receipts_payment_id_status_idx" ON "payment_receipts" ("status", "payment_id")');
    await assert.rejects(client.query(migrationSql), /same-name index .* incompatible definition/iu);
    await client.query("ROLLBACK");
  });
});

test("rejects a correct-looking FK that is deferred and not validated", { skip: !sourceUrl }, async () => {
  await withAuditDatabase("payment_untrusted_fk", async (client) => {
    await createLegacyPaymentTables(client);
    await client.query(migrationSql);
    await client.query('ALTER TABLE "payment_receipts" DROP CONSTRAINT "payment_receipts_payment_id_fkey"');
    await client.query(`ALTER TABLE "payment_receipts"
      ADD CONSTRAINT "payment_receipts_payment_id_fkey"
      FOREIGN KEY ("payment_id") REFERENCES "payments"("id")
      ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED NOT VALID`);
    await assert.rejects(client.query(migrationSql), /same-name foreign key .* incompatible definition/iu);
    await client.query("ROLLBACK");
  });
});

test("rejects an invalid or unready exact-name index", { skip: !sourceUrl }, async () => {
  await withAuditDatabase("payment_unhealthy_index", async (client) => {
    await createLegacyPaymentTables(client);
    await client.query(migrationSql);
    await client.query(`UPDATE pg_index SET indisvalid = false, indisready = false
      WHERE indexrelid = 'payment_receipts_payment_id_status_idx'::regclass`);
    await assert.rejects(client.query(migrationSql), /same-name index .* incompatible definition/iu);
    await client.query("ROLLBACK");
  });
});

test("rejects same-name indexes with DESC or non-default opclass semantics", { skip: !sourceUrl }, async () => {
  await withAuditDatabase("payment_desc_index", async (client) => {
    await createLegacyPaymentTables(client);
    await client.query(migrationSql);
    await client.query('DROP INDEX "payment_receipts_payment_id_status_idx"');
    await client.query('CREATE INDEX "payment_receipts_payment_id_status_idx" ON "payment_receipts" ("payment_id" DESC, "status")');
    await assert.rejects(client.query(migrationSql), /same-name index .* incompatible definition/iu);
    await client.query("ROLLBACK");
  });
  await withAuditDatabase("payment_opclass_index", async (client) => {
    await createLegacyPaymentTables(client);
    await client.query(migrationSql);
    await client.query('DROP INDEX "payment_receipts_payment_id_status_idx"');
    await client.query('CREATE INDEX "payment_receipts_payment_id_status_idx" ON "payment_receipts" ("payment_id", "status" text_pattern_ops)');
    await assert.rejects(client.query(migrationSql), /same-name index .* incompatible definition/iu);
    await client.query("ROLLBACK");
  });
});

test("rejects partially_paid payment when deterministic legacy receipt evidence is missing", { skip: !sourceUrl }, async () => {
  await withAuditDatabase("payment_missing_partial_evidence", async (client) => {
    await createLegacyPaymentTables(client);
    await client.query(migrationSql);
    await client.query('INSERT INTO "users" ("id") VALUES (1)');
    await client.query('INSERT INTO "bookings" ("id", "final_price", "payment_status") VALUES (101, 100, \'unpaid\')');
    await client.query(`INSERT INTO "payments" (
      "id", "booking_id", "user_id", "amount", "currency", "payment_method",
      "transaction_ref", "idempotency_key", "status"
    ) VALUES (201, 101, 1, 100, 'VND', 'manual', 'ref-201', 'payment-201', 'partially_paid')`);
    await assert.rejects(client.query(migrationSql), /missing deterministic legacy receipt evidence/iu);
    await client.query("ROLLBACK");
    const payment = await client.query('SELECT "status", "amount" FROM "payments" WHERE "id" = 201');
    assert.deepEqual(payment.rows, [{ status: "partially_paid", amount: 100 }]);
  });
});

test("rejects conflicting deterministic legacy receipt and refund evidence", { skip: !sourceUrl }, async () => {
  await withAuditDatabase("payment_conflicting_legacy", async (client) => {
    await createLegacyPaymentTables(client);
    await client.query(migrationSql);
    await client.query('INSERT INTO "users" ("id") VALUES (1)');
    await client.query(`INSERT INTO "bookings" ("id", "final_price", "payment_status")
      VALUES (101, 100, 'partially_refunded')`);
    await client.query(`INSERT INTO "payments" (
      "id", "booking_id", "user_id", "amount", "currency", "payment_method",
      "transaction_id", "transaction_ref", "idempotency_key", "status", "refund_amount"
    ) VALUES (201, 101, 1, 100, 'VND', 'VNPAY', 'gateway-201', 'ref-201', 'payment-201', 'partially_refunded', 20)`);
    await client.query(`INSERT INTO "payment_receipts" (
      "payment_id", "source", "gateway", "amount", "currency", "external_transaction_id",
      "idempotency_key", "status", "metadata"
    ) VALUES (201, 'legacy', 'VNPAY', 99, 'VND', 'gateway-201', 'legacy_payment_201', 'succeeded', '{"backfill":true}')`);
    await client.query(`INSERT INTO "refund_attempts" (
      "payment_id", "source", "gateway", "amount", "currency", "idempotency_key", "status", "metadata"
    ) VALUES (201, 'legacy', 'VNPAY', 19, 'VND', 'legacy_refund_201', 'succeeded', '{"backfill":true}')`);
    await assert.rejects(client.query(migrationSql), /conflicting deterministic legacy (?:receipt|refund)/iu);
    await client.query("ROLLBACK");
  });
});

test("rejects existing succeeded totals beyond obligation or collection", { skip: !sourceUrl }, async () => {
  await withAuditDatabase("payment_excess_receipts", async (client) => {
    await createLegacyPaymentTables(client);
    await client.query(migrationSql);
    await client.query('INSERT INTO "users" ("id") VALUES (1)');
    await client.query('INSERT INTO "bookings" ("id", "final_price") VALUES (101, 100)');
    await client.query(`INSERT INTO "payments" (
      "id", "booking_id", "user_id", "amount", "currency", "payment_method",
      "transaction_ref", "idempotency_key", "status"
    ) VALUES (201, 101, 1, 100, 'VND', 'manual', 'ref-201', 'payment-201', 'unpaid')`);
    await client.query(`INSERT INTO "payment_receipts" (
      "payment_id", "source", "amount", "currency", "idempotency_key", "status"
    ) VALUES (201, 'manual', 60, 'VND', 'receipt-a', 'succeeded'),
             (201, 'manual', 50, 'VND', 'receipt-b', 'succeeded')`);
    await assert.rejects(client.query(migrationSql), /succeeded receipts exceed payment obligation/iu);
    await client.query("ROLLBACK");
  });
  await withAuditDatabase("payment_excess_refunds", async (client) => {
    await createLegacyPaymentTables(client);
    await client.query(migrationSql);
    await client.query('INSERT INTO "users" ("id") VALUES (1)');
    await client.query('INSERT INTO "bookings" ("id", "final_price") VALUES (101, 100)');
    await client.query(`INSERT INTO "payments" (
      "id", "booking_id", "user_id", "amount", "currency", "payment_method",
      "transaction_ref", "idempotency_key", "status"
    ) VALUES (201, 101, 1, 100, 'VND', 'manual', 'ref-201', 'payment-201', 'unpaid')`);
    await client.query(`INSERT INTO "payment_receipts" (
      "payment_id", "source", "amount", "currency", "idempotency_key", "status"
    ) VALUES (201, 'manual', 50, 'VND', 'receipt-a', 'succeeded')`);
    await client.query(`INSERT INTO "refund_attempts" (
      "payment_id", "source", "amount", "currency", "idempotency_key", "status"
    ) VALUES (201, 'manual', 60, 'VND', 'refund-a', 'succeeded')`);
    await assert.rejects(client.query(migrationSql), /succeeded refunds exceed succeeded receipts/iu);
    await client.query("ROLLBACK");
  });
});

test("rejects duplicate non-null gateway external identifiers", { skip: !sourceUrl }, async () => {
  await withAuditDatabase("payment_duplicate_external", async (client) => {
    await createLegacyPaymentTables(client);
    await client.query('INSERT INTO "users" ("id") VALUES (1)');
    await client.query('INSERT INTO "bookings" ("id", "final_price") VALUES (101, 100)');
    await client.query(`INSERT INTO "payments" (
      "id", "booking_id", "user_id", "amount", "currency", "payment_method",
      "transaction_ref", "idempotency_key", "status"
    ) VALUES (201, 101, 1, 100, 'VND', 'manual', 'ref-201', 'payment-201', 'unpaid')`);
    await client.query(migrationSql);
    await client.query(`INSERT INTO "payment_receipts" (
      "payment_id", "source", "gateway", "amount", "currency", "external_transaction_id", "idempotency_key", "status"
    ) VALUES (201, 'manual', 'VNPAY', 10, 'VND', 'external-1', 'receipt-1', 'succeeded')`);
    await assert.rejects(client.query(`INSERT INTO "payment_receipts" (
      "payment_id", "source", "gateway", "amount", "currency", "external_transaction_id", "idempotency_key", "status"
    ) VALUES (201, 'manual', 'VNPAY', 10, 'VND', 'external-1', 'receipt-2', 'succeeded')`), /duplicate key/iu);
    await client.query(`INSERT INTO "refund_attempts" (
      "payment_id", "source", "gateway", "amount", "currency", "external_refund_id", "idempotency_key", "status"
    ) VALUES (201, 'manual', 'VNPAY', 10, 'VND', 'refund-external-1', 'refund-1', 'succeeded')`);
    await assert.rejects(client.query(`INSERT INTO "refund_attempts" (
      "payment_id", "source", "gateway", "amount", "currency", "external_refund_id", "idempotency_key", "status"
    ) VALUES (201, 'manual', 'VNPAY', 10, 'VND', 'refund-external-1', 'refund-2', 'succeeded')`), /duplicate key/iu);
  });
});
