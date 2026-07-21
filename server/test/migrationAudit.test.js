import test from "node:test";
import assert from "node:assert/strict";
import {
  AUDIT_DB_PREFIX,
  assertSafeAuditDatabaseName,
  buildPrismaCommands,
  buildDatabaseUrl,
  quoteIdentifier,
  assertOnlyAllowedRawSqlDrift,
} from "../src/scripts/lib/migrationAudit.js";

test("migration audit uses deploy and emits a reviewable drift script", () => {
  const commands = buildPrismaCommands({
    schemaPath: "prisma/schema.prisma",
    auditUrl: "postgresql://user:secret@localhost:5432/didaugio_codex_migration_clean",
  });
  assert.deepEqual(commands.deploy, [
    "prisma",
    "migrate",
    "deploy",
    "--schema=prisma/schema.prisma",
  ]);
  assert.deepEqual(commands.diff.slice(0, 4), ["prisma", "migrate", "diff", "--script"]);
  assert.ok(commands.diff.includes("--from-url"));
  assert.ok(commands.diff.includes("--to-schema-datamodel"));
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

test("drift guard permits only explicitly raw PostGIS boundary tables", () => {
  assert.doesNotThrow(() => assertOnlyAllowedRawSqlDrift(`
    -- DropTable
    DROP TABLE "administrative_province_boundaries";
    -- DropTable
    DROP TABLE "administrative_ward_boundaries";
  `));
  assert.throws(
    () => assertOnlyAllowedRawSqlDrift('ALTER TABLE "bookings" DROP COLUMN "resource_id";'),
    /managed schema drift/i,
  );
});
