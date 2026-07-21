import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

import {
  AUDIT_DB_PREFIX,
  assertSafeAuditDatabaseName,
  buildDatabaseUrl,
  quoteIdentifier,
} from "../src/scripts/lib/migrationAudit.js";

const sourceUrl = process.env.DATABASE_URL;
const serverRoot = fileURLToPath(new URL("..", import.meta.url));
const schemaPath = path.join(serverRoot, "prisma", "schema.prisma");
const prismaCli = createRequire(import.meta.url).resolve("prisma/build/index.js");
const migrationSql = await readFile(
  new URL(
    "../prisma/migrations/20260721010000_reconcile_prisma_schema/migration.sql",
    import.meta.url,
  ),
  "utf8",
);

function runPrisma(databaseUrl, args) {
  const result = spawnSync(process.execPath, [prismaCli, ...args], {
    cwd: serverRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(
      `Prisma ${args.join(" ")} failed with ${result.status}: ${result.stderr}`,
    );
  }
}

async function withAuditDatabase(label, run) {
  assert.ok(sourceUrl, "DATABASE_URL is required for reconciliation integration tests");
  const databaseName = assertSafeAuditDatabaseName(
    `${AUDIT_DB_PREFIX}reconcile_${label}_${crypto.randomBytes(6).toString("hex")}`,
  );
  const auditUrl = buildDatabaseUrl(sourceUrl, databaseName);
  const adminUrl = new URL(sourceUrl);
  adminUrl.pathname = "/postgres";
  const admin = new Client({ connectionString: adminUrl.toString() });
  let adminConnected = false;
  let audit;
  let result;
  let primaryFailure;

  try {
    await admin.connect();
    adminConnected = true;
    await admin.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    runPrisma(auditUrl, ["db", "push", `--schema=${schemaPath}`, "--skip-generate"]);
    audit = new Client({ connectionString: auditUrl });
    await audit.connect();
    result = await run(audit);
  } catch (error) {
    primaryFailure = error;
  } finally {
    await audit?.end().catch(() => undefined);
  }

  let cleanupFailure;
  try {
    if (!adminConnected) {
      await admin.connect();
      adminConnected = true;
    }
    await admin.query(
      `DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)} WITH (FORCE)`,
    );
  } catch (error) {
    cleanupFailure = error;
  } finally {
    await admin.end().catch(() => undefined);
  }

  if (primaryFailure && cleanupFailure) {
    throw new AggregateError(
      [primaryFailure, cleanupFailure],
      `Audit ${databaseName} failed and cleanup also failed`,
    );
  }
  if (primaryFailure) throw primaryFailure;
  if (cleanupFailure) throw cleanupFailure;
  return result;
}

async function withForeignKeysDisabled(client, operation) {
  await client.query("SET session_replication_role = replica");
  try {
    return await operation();
  } finally {
    await client.query("SET session_replication_role = origin");
  }
}

async function insertBooking(
  client,
  {
    code,
    finalPrice,
    commissionAmount,
    adminEarned = 0,
    businessEarned = 0,
    commissionRate = 10,
  },
) {
  await withForeignKeysDisabled(client, () =>
    client.query(
      `INSERT INTO "bookings" (
         "booking_code", "user_id", "service_id", "use_date",
         "guest_name", "guest_phone", "original_price", "final_price",
         "commission_amount", "business_id", "admin_earned",
         "business_earned", "commission_rate", "updated_at"
       ) VALUES (
         $1, 900001, 900001, CURRENT_DATE,
         'Reconciliation Audit', '0000000000', $2, $2,
         $3, 900001, $4, $5, $6, NOW()
       )`,
      [code, finalPrice, commissionAmount, adminEarned, businessEarned, commissionRate],
    ),
  );
}

test(
  "canonicalizes booking finance, category levels, and role protection idempotently",
  { skip: !sourceUrl },
  async () => {
    await withAuditDatabase("canonical", async (client) => {
      await client.query(`
        INSERT INTO "roles" (
          "id", "name", "display_name", "is_system", "is_protected"
        ) VALUES
          (610001, 'system-audit', 'System Audit', true, false),
          (610002, 'custom-audit', 'Custom Audit', false, false)
      `);
      await client.query(`
        INSERT INTO "categories" ("id", "name", "slug", "parent_id", "level")
        VALUES (620001, 'Root Audit', 'root-audit', NULL, 1)
      `);
      await client.query(`
        INSERT INTO "categories" ("id", "name", "slug", "parent_id", "level")
        VALUES
          (620002, 'Child Audit', 'child-audit', 620001, 1),
          (620003, 'Grandchild Audit', 'grandchild-audit', 620002, 1)
      `);
      await insertBooking(client, {
        code: "TASK4-CANONICAL",
        finalPrice: 1000,
        commissionAmount: 125,
      });

      await client.query(migrationSql);
      await client.query(migrationSql);

      const booking = await client.query(`
        SELECT "admin_earned", "business_earned", "commission_rate"
        FROM "bookings" WHERE "booking_code" = 'TASK4-CANONICAL'
      `);
      assert.deepEqual(booking.rows, [{
        admin_earned: 125,
        business_earned: 875,
        commission_rate: 13,
      }]);

      const categories = await client.query(`
        SELECT "id", "level" FROM "categories"
        WHERE "id" BETWEEN 620001 AND 620003 ORDER BY "id"
      `);
      assert.deepEqual(categories.rows, [
        { id: 620001, level: 1 },
        { id: 620002, level: 2 },
        { id: 620003, level: 3 },
      ]);

      const roles = await client.query(`
        SELECT "name", "is_protected" FROM "roles"
        WHERE "id" IN (610001, 610002) ORDER BY "id"
      `);
      assert.deepEqual(roles.rows, [
        { name: "system-audit", is_protected: true },
        { name: "custom-audit", is_protected: false },
      ]);
    });
  },
);

test(
  "rejects invalid booking sources even when target finance fields are non-null",
  { skip: !sourceUrl },
  async () => {
    await withAuditDatabase("invalid_finance", async (client) => {
      await insertBooking(client, {
        code: "TASK4-INVALID-FINANCE",
        finalPrice: 100,
        commissionAmount: 125,
      });

      await assert.rejects(
        client.query(migrationSql),
        /Booking financial backfill refused/iu,
      );
      await client.query("ROLLBACK");

      const booking = await client.query(`
        SELECT "admin_earned", "business_earned", "commission_rate"
        FROM "bookings" WHERE "booking_code" = 'TASK4-INVALID-FINANCE'
      `);
      assert.deepEqual(booking.rows, [{
        admin_earned: 0,
        business_earned: 0,
        commission_rate: 10,
      }]);
    });
  },
);

test(
  "rejects category cycles, orphans, and hierarchies deeper than three atomically",
  { skip: !sourceUrl },
  async () => {
    const scenarios = [
      {
        label: "category_cycle",
        expected: /Category hierarchy[^\n]*cycle/iu,
        seed: async (client) => {
          await client.query(`
            INSERT INTO "categories" ("id", "name", "slug", "level") VALUES
              (630001, 'Cycle One', 'cycle-one', 1),
              (630002, 'Cycle Two', 'cycle-two', 1)
          `);
          await client.query(`UPDATE "categories" SET "parent_id" = 630002 WHERE "id" = 630001`);
          await client.query(`UPDATE "categories" SET "parent_id" = 630001 WHERE "id" = 630002`);
        },
      },
      {
        label: "category_orphan",
        expected: /Category hierarchy[^\n]*orphan/iu,
        seed: (client) => withForeignKeysDisabled(client, () => client.query(`
          INSERT INTO "categories" ("id", "name", "slug", "parent_id", "level")
          VALUES (630011, 'Orphan', 'orphan', 999999, 1)
        `)),
      },
      {
        label: "category_depth",
        expected: /Category hierarchy[^\n]*depth exceeds 3/iu,
        seed: async (client) => {
          await client.query(`
            INSERT INTO "categories" ("id", "name", "slug", "parent_id", "level") VALUES
              (630021, 'Depth One', 'depth-one', NULL, 1),
              (630022, 'Depth Two', 'depth-two', 630021, 1),
              (630023, 'Depth Three', 'depth-three', 630022, 1),
              (630024, 'Depth Four', 'depth-four', 630023, 1)
          `);
        },
      },
    ];

    for (const scenario of scenarios) {
      await withAuditDatabase(scenario.label, async (client) => {
        await scenario.seed(client);
        await assert.rejects(client.query(migrationSql), scenario.expected);
        await client.query("ROLLBACK");
        const levels = await client.query(
          `SELECT DISTINCT "level" FROM "categories" ORDER BY "level"`,
        );
        assert.deepEqual(levels.rows, [{ level: 1 }]);
      });
    }
  },
);

test(
  "rejects an existing same-name index with an incompatible definition",
  { skip: !sourceUrl },
  async () => {
    await withAuditDatabase("wrong_index", async (client) => {
      await client.query(`DROP INDEX "users_status_idx"`);
      await client.query(`CREATE INDEX "users_status_idx" ON "users"("deleted_at")`);
      await assert.rejects(
        client.query(migrationSql),
        /Existing index users_status_idx is incompatible/iu,
      );
      await client.query("ROLLBACK");
    });
  },
);

test(
  "rejects an existing same-name constraint with an incompatible definition",
  { skip: !sourceUrl },
  async () => {
    await withAuditDatabase("wrong_constraint", async (client) => {
      await client.query(`ALTER TABLE "bookings" DROP CONSTRAINT "bookings_business_id_fkey"`);
      await client.query(`
        ALTER TABLE "bookings"
        ADD CONSTRAINT "bookings_business_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
      `);
      await assert.rejects(
        client.query(migrationSql),
        /Existing constraint bookings\.bookings_business_id_fkey is incompatible/iu,
      );
      await client.query("ROLLBACK");
    });
  },
);
