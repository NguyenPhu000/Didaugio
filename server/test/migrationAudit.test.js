import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as migrationAudit from "../src/scripts/lib/migrationAudit.js";
import {
  AUDIT_DB_PREFIX,
  assertSafeAuditDatabaseName,
  buildPrismaCommands,
  buildDatabaseUrl,
  quoteIdentifier,
  assertOnlyAllowedRawSqlDrift,
  runMigrationAudit,
} from "../src/scripts/lib/migrationAudit.js";

const verifyMigrationHistorySource = fs.readFileSync(
  new URL("../src/scripts/verifyMigrationHistory.js", import.meta.url),
  "utf8",
);

test("migration audit uses deploy and emits a reviewable drift script", () => {
  const commands = buildPrismaCommands({
    schemaPath: "prisma/schema.prisma",
  });
  assert.deepEqual(commands.deploy, [
    "prisma",
    "migrate",
    "deploy",
    "--schema=prisma/schema.prisma",
  ]);
  assert.deepEqual(commands.diff.slice(0, 4), ["prisma", "migrate", "diff", "--script"]);
  assert.ok(commands.diff.includes("--from-schema-datasource"));
  assert.ok(commands.diff.includes("--to-schema-datamodel"));
  assert.ok(!commands.diff.some((arg) => arg.includes("postgresql://")));
});

test("migration audit always runs cleanup for create, deploy, and diff failures", async () => {
  for (const failedStep of ["create", "deploy", "diff"]) {
    const calls = [];
    const step = (name) => async () => {
      calls.push(name);
      if (name === failedStep) throw new Error(`${name} failed`);
      return name === "diff" ? "" : undefined;
    };
    await assert.rejects(
      runMigrationAudit({
        create: step("create"),
        deploy: step("deploy"),
        diff: step("diff"),
        cleanup: step("cleanup"),
      }),
      new RegExp(`${failedStep} failed`, "u"),
    );
    assert.equal(calls.at(-1), "cleanup");
  }
});

test("migration audit preserves primary and cleanup failures", async () => {
  const primaryFailure = new Error("deploy failed");
  const cleanupFailure = new Error("cleanup failed");

  await assert.rejects(
    runMigrationAudit({
      create: async () => undefined,
      deploy: async () => {
        throw primaryFailure;
      },
      diff: async () => "",
      cleanup: async () => {
        throw cleanupFailure;
      },
    }),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.deepEqual(error.errors, [primaryFailure, cleanupFailure]);
      return true;
    },
  );
});

test("migration audit accepts only its dedicated database prefix", () => {
  assert.equal(
    assertSafeAuditDatabaseName(`${AUDIT_DB_PREFIX}clean_123`),
    `${AUDIT_DB_PREFIX}clean_123`,
  );
  for (const unsafe of ["didaugio", "postgres", "template1", "../didaugio", "audit-db"]) {
    assert.throws(() => assertSafeAuditDatabaseName(unsafe), /unsafe audit database name/i);
  }
});

test("migration audit rewrites only the database path", () => {
  const result = new URL(
    buildDatabaseUrl(
      "postgresql://user:secret@localhost:5432/didaugio?schema=public",
      `${AUDIT_DB_PREFIX}clean_123`,
    ),
  );
  assert.equal(result.pathname, `/${AUDIT_DB_PREFIX}clean_123`);
  assert.equal(result.searchParams.get("schema"), "public");
  assert.equal(result.username, "user");
});

test("identifier quoting rejects values outside the safe database grammar", () => {
  assert.equal(quoteIdentifier(`${AUDIT_DB_PREFIX}clean_123`), `"${AUDIT_DB_PREFIX}clean_123"`);
  assert.throws(() => quoteIdentifier(`x"; DROP DATABASE didaugio; --`), /unsafe audit database name/i);
});

test("drift guard permits only exact residual statements for preserved raw objects", () => {
  assert.doesNotThrow(() => assertOnlyAllowedRawSqlDrift(`
    -- DropForeignKey
    ALTER TABLE "administrative_ward_boundaries" DROP CONSTRAINT "administrative_ward_boundarie_dataset_release_id_ward_code_fkey";
    -- DropForeignKey
    ALTER TABLE "province_boundaries" DROP CONSTRAINT "province_boundaries_dataset_release_id_province_code_fkey";
    -- DropIndex
    DROP INDEX "ward_records_search_trgm_idx";
    -- DropIndex
    DROP INDEX "province_records_search_trgm_idx";
    -- DropTable
    DROP TABLE "province_boundaries";
    -- DropTable
    DROP TABLE "administrative_ward_boundaries";
  `));
  assert.throws(
    () => assertOnlyAllowedRawSqlDrift('DROP TABLE "administrative_province_boundaries";'),
    /managed schema drift/i,
  );
  for (const unsafe of [
    'ALTER TABLE "province_boundaries" DROP CONSTRAINT "administrative_ward_boundarie_dataset_release_id_ward_code_fkey";',
    'ALTER TABLE "administrative_ward_boundaries" DROP CONSTRAINT "unexpected_fkey";',
    'DROP INDEX "ward_records_search_trgm_idx_extra";',
    'DROP INDEX "province_boundaries_geom_gist_idx";',
  ]) assert.throws(() => assertOnlyAllowedRawSqlDrift(unsafe), /managed schema drift/i);
  assert.throws(
    () => assertOnlyAllowedRawSqlDrift('ALTER TABLE "bookings" DROP COLUMN "resource_id";'),
    /managed schema drift/i,
  );
});

test("Prisma child processes use the shared 120 second safety bound", () => {
  assert.equal(migrationAudit.PRISMA_SPAWN_TIMEOUT_MS, 120_000);
  assert.match(
    verifyMigrationHistorySource,
    /timeout:\s*PRISMA_SPAWN_TIMEOUT_MS/u,
  );
});

test("spawn result guard surfaces timeouts and nonzero exits", () => {
  assert.equal(typeof migrationAudit.assertSuccessfulSpawn, "function");
  assert.throws(
    () => migrationAudit.assertSuccessfulSpawn(
      { error: Object.assign(new Error("timed out"), { code: "ETIMEDOUT" }) },
      "Prisma db push",
    ),
    /Prisma db push timed out after 120000ms/iu,
  );
  assert.throws(
    () => migrationAudit.assertSuccessfulSpawn(
      { status: 1, stderr: "schema failure" },
      "Prisma migrate deploy",
    ),
    /Prisma migrate deploy exited with 1: schema failure/iu,
  );
  assert.equal(
    migrationAudit.assertSuccessfulSpawn({ status: 0, stdout: "ok" }, "Prisma"),
    "ok",
  );
});
