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
  PRISMA_SPAWN_TIMEOUT_MS,
  assertSafeAuditDatabaseName,
  assertSuccessfulSpawn,
  buildDatabaseUrl,
  buildPgClientConfig,
  quoteIdentifier,
} from "../src/scripts/lib/migrationAudit.js";

const sourceUrl = process.env.DATABASE_URL;
const databaseSkip = sourceUrl
  ? false
  : "DATABASE_URL is required for reconciliation integration tests";
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
    timeout: PRISMA_SPAWN_TIMEOUT_MS,
  });
  assertSuccessfulSpawn(result, `Prisma ${args.join(" ")}`);
}

async function withAuditDatabase(label, run) {
  assert.ok(sourceUrl, "DATABASE_URL is required for reconciliation integration tests");
  const databaseName = assertSafeAuditDatabaseName(
    `${AUDIT_DB_PREFIX}reconcile_${label}_${crypto.randomBytes(6).toString("hex")}`,
  );
  const auditUrl = buildDatabaseUrl(sourceUrl, databaseName);
  const adminUrl = new URL(sourceUrl);
  adminUrl.pathname = "/postgres";
  const admin = new Client(buildPgClientConfig(adminUrl.toString()));
  let adminConnected = false;
  let audit;
  let result;
  let primaryFailure;

  try {
    await admin.connect();
    adminConnected = true;
    await admin.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    runPrisma(auditUrl, ["db", "push", `--schema=${schemaPath}`, "--skip-generate"]);
    audit = new Client(buildPgClientConfig(auditUrl));
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

async function snapshotCanonicalState(client) {
  const [booking, categories, roles] = await Promise.all([
    client.query(`
      SELECT "admin_earned", "business_earned", "commission_rate"
      FROM "bookings" WHERE "booking_code" = 'TASK4-CANONICAL'
    `),
    client.query(`
      SELECT "id", "level" FROM "categories"
      WHERE "id" BETWEEN 620001 AND 620003 ORDER BY "id"
    `),
    client.query(`
      SELECT "name", "is_protected" FROM "roles"
      WHERE "id" IN (610001, 610002) ORDER BY "id"
    `),
  ]);
  return {
    booking: booking.rows,
    categories: categories.rows,
    roles: roles.rows,
  };
}

async function getConstraintSnapshot(client, table, constraint) {
  const result = await client.query(
    `SELECT c.oid::int AS "oid", pg_get_constraintdef(c.oid, true) AS "definition"
     FROM pg_constraint c
     WHERE c.conrelid = $1::regclass AND c.conname = $2`,
    [`public.${table}`, constraint],
  );
  assert.equal(result.rowCount, 1, `missing ${table}.${constraint}`);
  return result.rows[0];
}

test(
  "canonicalizes booking finance, category levels, and role protection idempotently",
  { skip: databaseSkip },
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
      const afterFirst = await snapshotCanonicalState(client);
      await client.query(migrationSql);
      const afterSecond = await snapshotCanonicalState(client);

      assert.deepEqual(afterSecond, afterFirst, "second application must be idempotent");
      assert.deepEqual(afterFirst, {
        booking: [{
          admin_earned: 125,
          business_earned: 875,
          commission_rate: 13,
        }],
        categories: [
          { id: 620001, level: 1 },
          { id: 620002, level: 2 },
          { id: 620003, level: 3 },
        ],
        roles: [
          { name: "system-audit", is_protected: true },
          { name: "custom-audit", is_protected: false },
        ],
      });
    });
  },
);

test(
  "rejects invalid booking sources even when target finance fields are non-null",
  { skip: databaseSkip },
  async () => {
    await withAuditDatabase("invalid_finance", async (client) => {
      await client.query(`
        INSERT INTO "roles" (
          "id", "name", "display_name", "is_system", "is_protected"
        ) VALUES (610011, 'rollback-system', 'Rollback System', true, false)
      `);
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
      const role = await client.query(`
        SELECT "is_system", "is_protected" FROM "roles" WHERE "id" = 610011
      `);
      assert.deepEqual(role.rows, [{ is_system: true, is_protected: false }]);
    });
  },
);

test(
  "rejects category cycles, orphans, and hierarchies deeper than three atomically",
  { skip: databaseSkip },
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
        const constraintBefore = await getConstraintSnapshot(
          client,
          "places",
          "places_district_id_fkey",
        );
        await scenario.seed(client);
        await assert.rejects(client.query(migrationSql), scenario.expected);
        await client.query("ROLLBACK");
        const levels = await client.query(
          `SELECT DISTINCT "level" FROM "categories" ORDER BY "level"`,
        );
        assert.deepEqual(levels.rows, [{ level: 1 }]);
        const constraintAfter = await getConstraintSnapshot(
          client,
          "places",
          "places_district_id_fkey",
        );
        assert.deepEqual(constraintAfter, constraintBefore);
      });
    }
  },
);

test(
  "rejects an existing same-name index with an incompatible definition",
  { skip: databaseSkip },
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
  { skip: databaseSkip },
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

test(
  "rejects a same-name index on a differently cased quoted column",
  { skip: databaseSkip },
  async () => {
    await withAuditDatabase("quoted_index", async (client) => {
      await client.query(`DROP INDEX "users_status_idx"`);
      await client.query(`ALTER TABLE "users" ADD COLUMN "Status" TEXT`);
      await client.query(`CREATE INDEX "users_status_idx" ON "users"("Status")`);
      await assert.rejects(
        client.query(migrationSql),
        /Existing index users_status_idx is incompatible/iu,
      );
      await client.query("ROLLBACK");
    });
  },
);

test(
  "rejects an expected-definition index whose PostgreSQL health flags are false",
  { skip: databaseSkip },
  async (t) => {
    await withAuditDatabase("unhealthy_index", async (client) => {
      await client.query(`DROP INDEX "users_username_key"`);
      await withForeignKeysDisabled(client, () => client.query(`
        INSERT INTO "users" (
          "email", "username", "password", "role_id", "updated_at"
        ) VALUES
          ('unhealthy-one@example.invalid', 'duplicate-for-index', 'x', 900001, NOW()),
          ('unhealthy-two@example.invalid', 'duplicate-for-index', 'x', 900001, NOW())
      `));
      await assert.rejects(
        client.query(`CREATE UNIQUE INDEX CONCURRENTLY "users_username_key" ON "users"("username")`),
        /could not create unique index|duplicate key/iu,
      );
      await client.query(`DELETE FROM "users" WHERE "email" = 'unhealthy-two@example.invalid'`);

      const health = await client.query(`
        SELECT index_state.indisvalid, index_state.indisready, index_state.indislive
        FROM pg_index index_state
        WHERE index_state.indexrelid = 'public.users_username_key'::regclass
      `);
      assert.equal(health.rowCount, 1, "failed concurrent build must leave an index");
      assert.ok(
        !health.rows[0].indisvalid
          || !health.rows[0].indisready
          || !health.rows[0].indislive,
        "safe unhealthy-index fixture did not produce a false health flag",
      );
      t.diagnostic(`unhealthy index flags: ${JSON.stringify(health.rows[0])}`);

      await assert.rejects(
        client.query(migrationSql),
        /Existing index users_username_key is unhealthy/iu,
      );
      await client.query("ROLLBACK");
    });
  },
);

test(
  "rejects a same-name foreign key on a differently cased quoted column",
  { skip: databaseSkip },
  async () => {
    await withAuditDatabase("quoted_constraint", async (client) => {
      await client.query(`ALTER TABLE "bookings" DROP CONSTRAINT "bookings_business_id_fkey"`);
      await client.query(`ALTER TABLE "bookings" ADD COLUMN "Business_Id" INTEGER`);
      await client.query(`
        ALTER TABLE "bookings"
        ADD CONSTRAINT "bookings_business_id_fkey"
        FOREIGN KEY ("Business_Id") REFERENCES "businesses"("id")
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

test(
  "rejects a historical rename source on the wrong table or definition",
  { skip: databaseSkip },
  async () => {
    await withAuditDatabase("wrong_rename", async (client) => {
      await client.query(`DROP INDEX "province_dataset_records_dataset_release_id_is_active_idx"`);
      await client.query(`CREATE INDEX "province_records_release_active_idx" ON "users"("status")`);
      await assert.rejects(
        client.query(migrationSql),
        /Historical index province_records_release_active_idx is incompatible/iu,
      );
      await client.query("ROLLBACK");
    });
  },
);

test(
  "accepts exact standalone indexes and rejects alternate index semantics",
  { skip: databaseSkip },
  async () => {
    const scenarios = [
      {
        label: "exact_standalone",
        setup: (client) => client.query(`
          DROP INDEX "users_status_idx";
          CREATE INDEX "users_status_idx" ON "users"("status")
        `),
        expected: null,
      },
      {
        label: "pattern_opclass",
        setup: (client) => client.query(`
          DROP INDEX "users_username_key";
          CREATE UNIQUE INDEX "users_username_key" ON "users"("username" text_pattern_ops)
        `),
        expected: /Existing index users_username_key is incompatible/iu,
      },
      {
        label: "explicit_collation",
        setup: (client) => client.query(`
          DROP INDEX "users_username_key";
          CREATE UNIQUE INDEX "users_username_key" ON "users"("username" COLLATE "C")
        `),
        expected: /Existing index users_username_key is incompatible/iu,
      },
      {
        label: "constraint_backed",
        setup: async (client) => {
          await client.query(`DROP INDEX "users_username_key"`);
          await client.query(`
            ALTER TABLE "users" ADD CONSTRAINT "users_username_key"
            UNIQUE ("username") DEFERRABLE INITIALLY IMMEDIATE
          `);
        },
        expected: /Existing index users_username_key is incompatible/iu,
      },
    ];

    for (const scenario of scenarios) {
      await withAuditDatabase(scenario.label, async (client) => {
        await scenario.setup(client);
        if (scenario.expected) {
          await assert.rejects(client.query(migrationSql), scenario.expected);
          await client.query("ROLLBACK");
        } else {
          await client.query(migrationSql);
        }
      });
    }
  },
);

test(
  "handles every historical index rename state and rejects semantic near misses",
  { skip: databaseSkip },
  async (t) => {
    const oldName = "province_records_release_active_idx";
    const targetName = "province_dataset_records_dataset_release_id_is_active_idx";
    const scenarios = [
      {
        label: "rename_target_only",
        setup: async () => undefined,
        expected: null,
      },
      {
        label: "rename_old_only",
        setup: (client) => client.query(`
          DROP INDEX "${targetName}";
          CREATE INDEX "${oldName}"
          ON "province_dataset_records"("dataset_release_id", "is_active")
        `),
        expected: null,
        verify: async (client) => {
          const result = await client.query(
            `SELECT to_regclass('public.${oldName}') AS old_index,
                    to_regclass('public.${targetName}') AS target_index`,
          );
          assert.equal(result.rows[0].old_index, null);
          assert.equal(result.rows[0].target_index, targetName);
        },
      },
      {
        label: "rename_missing",
        setup: (client) => client.query(`DROP INDEX "${targetName}"`),
        expected: /Historical index .* and target .* are both missing/iu,
      },
      {
        label: "rename_wrong_target_table",
        setup: (client) => client.query(`
          DROP INDEX "${targetName}";
          CREATE INDEX "${targetName}" ON "users"("status")
        `),
        expected: /Historical target index .* is incompatible/iu,
      },
      {
        label: "rename_alternate_opclass",
        setup: (client) => client.query(`
          DROP INDEX "place_administrative_location_exceptions_dataset_release_id_idx";
          CREATE INDEX "place_administrative_location_exceptions_dataset_release_id_idx"
          ON "place_administrative_location_exceptions"("dataset_release_id", "status" text_pattern_ops)
        `),
        expected: /Historical target index .* is incompatible/iu,
      },
      {
        label: "rename_alternate_collation",
        setup: (client) => client.query(`
          DROP INDEX "place_administrative_location_exceptions_dataset_release_id_idx";
          CREATE INDEX "place_administrative_location_exceptions_dataset_release_id_idx"
          ON "place_administrative_location_exceptions"("dataset_release_id", "status" COLLATE "C")
        `),
        expected: /Historical target index .* is incompatible/iu,
      },
      {
        label: "rename_both",
        setup: (client) => client.query(`
          CREATE INDEX "${oldName}"
          ON "province_dataset_records"("dataset_release_id", "is_active")
        `),
        expected: /both historical index .* and target .* exist/iu,
      },
    ];

    for (const scenario of scenarios) {
      await withAuditDatabase(scenario.label, async (client) => {
        await scenario.setup(client);
        if (scenario.expected) {
          await assert.rejects(client.query(migrationSql), scenario.expected);
          await client.query("ROLLBACK");
        } else {
          await client.query(migrationSql);
          await scenario.verify?.(client);
        }
      });
    }

    await withAuditDatabase("rename_unhealthy", async (client) => {
      const target = "place_administrative_location_exceptions_place_id_dataset_r_key";
      await client.query(`DROP INDEX "${target}"`);
      await withForeignKeysDisabled(client, async () => {
        await client.query(`INSERT INTO "categories" ("id", "name", "slug")
          VALUES (910001, 'Historical fixture', 'historical-fixture')`);
        await client.query(`INSERT INTO "administrative_dataset_releases"
          ("id", "source_repo", "source_ref", "source_commit", "release_name", "manifest_checksum")
          VALUES (910001, 'fixture/repo', 'fixture-ref', 'fixture-commit', 'fixture-release', 'fixture-checksum')`);
        await client.query(`INSERT INTO "places"
          ("id", "category_id", "name", "slug", "address", "latitude", "longitude", "created_by", "updated_at")
          VALUES (910001, 910001, 'Historical fixture', 'historical-fixture', 'fixture', 10, 106, 910001, NOW())`);
        await client.query(`
          INSERT INTO "place_administrative_location_exceptions"
            ("place_id", "dataset_release_id", "reason", "candidate_ward_codes", "suggested_wards", "updated_at")
          VALUES
            (910001, 910001, 'zero_match', '{}', '[]', NOW()),
            (910001, 910001, 'zero_match', '{}', '[]', NOW())
        `);
      });
      await assert.rejects(
        client.query(`CREATE UNIQUE INDEX CONCURRENTLY "${target}"
          ON "place_administrative_location_exceptions"("place_id", "dataset_release_id")`),
        /could not create unique index|duplicate key/iu,
      );
      await client.query(`DELETE FROM "place_administrative_location_exceptions"
        WHERE "id" = (SELECT MAX("id") FROM "place_administrative_location_exceptions")`);
      const health = await client.query(`SELECT indisvalid, indisready, indislive
        FROM pg_index WHERE indexrelid = $1::regclass`, [`public.${target}`]);
      t.diagnostic(`historical unhealthy index flags: ${JSON.stringify(health.rows[0])}`);
      await assert.rejects(
        client.query(migrationSql),
        /Historical target index .* is unhealthy/iu,
      );
      await client.query("ROLLBACK");
    });
  },
);

test(
  "rejects foreign keys whose internal enforcement triggers are disabled",
  { skip: databaseSkip },
  async () => {
    await withAuditDatabase("disabled_fk_triggers", async (client) => {
      await client.query(`ALTER TABLE "bookings" DISABLE TRIGGER ALL`);
      await assert.rejects(
        client.query(migrationSql),
        /Existing constraint .* is not enforced/iu,
      );
      await client.query("ROLLBACK");
    });
  },
);
