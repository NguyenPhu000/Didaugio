import "dotenv/config";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
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

const migrationPath = path.resolve(
  "prisma/migrations/20260721210000_scope_booking_idempotency_per_user/migration.sql",
);
const migrationSql = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, "utf8") : "";
const sourceUrl = process.env.DATABASE_URL;

async function withAuditDatabase(label, run) {
  assert.ok(sourceUrl, "DATABASE_URL is required for booking idempotency migration tests");
  const databaseName = buildAuditDatabaseName(label);
  const databaseUrl = buildDatabaseUrl(sourceUrl, databaseName);
  const admin = new Client(buildPgClientConfig(buildAdminDatabaseUrl(sourceUrl)));
  let ownsDatabase = false;
  let audit;
  try {
    await admin.connect();
    await admin.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    ownsDatabase = true;
    audit = new Client(buildPgClientConfig(databaseUrl));
    await audit.connect();
    return await run(audit);
  } finally {
    await audit?.end().catch(() => undefined);
    if (ownsDatabase) await dropOwnedAuditDatabase(admin, databaseName);
    await admin.end().catch(() => undefined);
  }
}

async function createLegacyBookings(client, indexSql) {
  await client.query(`
    CREATE TABLE "bookings" (
      "id" SERIAL PRIMARY KEY,
      "user_id" INTEGER NOT NULL,
      "idempotency_key" TEXT
    );
    ${indexSql}
  `);
}

test("booking idempotency migration is transactional and validates both exact index definitions", () => {
  assert.ok(migrationSql, "booking idempotency migration is missing");
  const uncommented = migrationSql.replace(/^\s*--.*$/gmu, "").trim();
  assert.ok(uncommented.startsWith("BEGIN;"));
  assert.ok(uncommented.endsWith("COMMIT;"));
  for (const token of [
    "bookings_idempotency_key_key",
    "bookings_user_id_idempotency_key_key",
    "indisunique",
    "indisvalid",
    "indisready",
    "indislive",
    "indpred",
    "indexprs",
    "incompatible booking idempotency index",
  ]) assert.ok(migrationSql.includes(token), `missing fail-closed migration token: ${token}`);
});

test(
  "booking idempotency migration permits the same key for two users and is idempotent",
  { skip: !sourceUrl || !migrationSql },
  async () => {
    await withAuditDatabase("booking_idempotency_scope", async (client) => {
      await createLegacyBookings(
        client,
        'CREATE UNIQUE INDEX "bookings_idempotency_key_key" ON "bookings" ("idempotency_key");',
      );
      await client.query("INSERT INTO bookings (user_id, idempotency_key) VALUES (1, 'shared')");
      await client.query(migrationSql);
      await client.query(migrationSql);
      await client.query("INSERT INTO bookings (user_id, idempotency_key) VALUES (2, 'shared')");
      await assert.rejects(
        client.query("INSERT INTO bookings (user_id, idempotency_key) VALUES (1, 'shared')"),
        /duplicate key/iu,
      );
      const definitions = await client.query(`
        SELECT indexname, indexdef FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'bookings'
        ORDER BY indexname
      `);
      assert.ok(definitions.rows.some((row) =>
        row.indexname === "bookings_user_id_idempotency_key_key"
          && /UNIQUE INDEX .* \(user_id, idempotency_key\)$/u.test(row.indexdef)));
      assert.equal(definitions.rows.some((row) => row.indexname === "bookings_idempotency_key_key"), false);

      await client.query('DROP INDEX "bookings_user_id_idempotency_key_key"');
      await client.query(
        'CREATE UNIQUE INDEX "bookings_user_id_idempotency_key_key" ON "bookings" ("idempotency_key", "user_id")',
      );
      await assert.rejects(client.query(migrationSql), /incompatible booking idempotency index/iu);
      await client.query("ROLLBACK");
      const wrongDefinition = await client.query(`
        SELECT indexdef FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'bookings_user_id_idempotency_key_key'
      `);
      assert.match(wrongDefinition.rows[0].indexdef, /\(idempotency_key, user_id\)$/u);
    });
  },
);

test(
  "booking idempotency migration rejects a same-name incompatible legacy index atomically",
  { skip: !sourceUrl || !migrationSql },
  async () => {
    await withAuditDatabase("booking_idempotency_refusal", async (client) => {
      await createLegacyBookings(
        client,
        'CREATE UNIQUE INDEX "bookings_idempotency_key_key" ON "bookings" ("user_id");',
      );
      await assert.rejects(client.query(migrationSql), /incompatible booking idempotency index/iu);
      await client.query("ROLLBACK");
      const relations = await client.query(`
        SELECT to_regclass('public.bookings_idempotency_key_key') AS legacy,
               to_regclass('public.bookings_user_id_idempotency_key_key') AS composite
      `);
      assert.equal(relations.rows[0].legacy, "bookings_idempotency_key_key");
      assert.equal(relations.rows[0].composite, null);
    });
  },
);
