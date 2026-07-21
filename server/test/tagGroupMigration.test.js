import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Client } from "pg";

import {
  AUDIT_DB_PREFIX,
  buildDatabaseUrl,
  quoteIdentifier,
} from "../src/scripts/lib/migrationAudit.js";

const migrationSql = await readFile(
  new URL("../prisma/migrations/20260721153000_add_tag_groups/migration.sql", import.meta.url),
  "utf8",
);
const sourceUrl = process.env.DATABASE_URL;

function createAuditDatabaseName() {
  return `${AUDIT_DB_PREFIX}tag_groups_${crypto.randomBytes(6).toString("hex")}`;
}

async function withAuditDatabase(run) {
  const databaseName = createAuditDatabaseName();
  const auditUrl = buildDatabaseUrl(sourceUrl, databaseName);
  const adminUrl = new URL(sourceUrl);
  adminUrl.pathname = "/postgres";
  const admin = new Client({ connectionString: adminUrl.toString() });

  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    const audit = new Client({ connectionString: auditUrl });
    await audit.connect();
    try {
      await audit.query('CREATE TABLE "place_tags" ("id" SERIAL PRIMARY KEY, "name" TEXT NOT NULL)');
      await audit.query("INSERT INTO \"place_tags\" (\"name\") VALUES ('legacy-one'), ('legacy-two')");
      return await run(audit);
    } finally {
      await audit.end().catch(() => undefined);
    }
  } finally {
    await admin
      .query(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)} WITH (FORCE)`)
      .catch(() => undefined);
    await admin.end().catch(() => undefined);
  }
}

test(
  "backfills every legacy tag to the unique general group and remains idempotent",
  { skip: !sourceUrl },
  async () => {
    await withAuditDatabase(async (client) => {
      await client.query(migrationSql);
      await client.query(migrationSql);

      const groups = await client.query(
        'SELECT "id", "slug", "name_vi", "name_en" FROM "tag_groups" WHERE "slug" = \'general\'',
      );
      const tags = await client.query(
        'SELECT COUNT(*)::int AS "orphanedTagCount" FROM "place_tags" WHERE "tag_group_id" IS NULL',
      );

      assert.deepEqual(groups.rows, [{ id: 1, slug: "general", name_vi: "Chung", name_en: "General" }]);
      assert.equal(tags.rows[0].orphanedTagCount, 0);
    });
  },
);

test(
  "aborts and rolls back when backfill leaves a legacy tag without a group",
  { skip: !sourceUrl },
  async () => {
    const brokenBackfillSql = migrationSql.replace(
      `WHERE "slug" = 'general'`,
      `WHERE "slug" = 'missing'`,
    );
    assert.notEqual(brokenBackfillSql, migrationSql);

    await withAuditDatabase(async (client) => {
      await assert.rejects(
        client.query(brokenBackfillSql),
        /tag group backfill left orphaned place tags/i,
      );
      await client.query("ROLLBACK");

      const table = await client.query("SELECT to_regclass('public.tag_groups') AS relation");
      assert.equal(table.rows[0].relation, null);
    });
  },
);
