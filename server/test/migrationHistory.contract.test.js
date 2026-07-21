import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  lexPostgresTopLevel,
  splitTopLevelStatements,
} from "./helpers/postgresSqlLexer.js";

const migrationsRoot = path.resolve("prisma/migrations");
const reconciliationPath = path.join(
  migrationsRoot,
  "20260721010000_reconcile_prisma_schema",
  "migration.sql",
);
const reconciliationSql = fs.readFileSync(reconciliationPath, "utf8");

function assertTableAddsColumn(table, column) {
  assert.match(
    reconciliationSql,
    new RegExp(
      `ALTER TABLE "${table}"[^;]*ADD COLUMN IF NOT EXISTS "${column}"`,
      "u",
    ),
    `${table}.${column} must be added by a table-scoped ALTER TABLE statement`,
  );
}

function assertSafeTopLevelMigration(sql) {
  const statements = splitTopLevelStatements(String(sql));
  const words = (statement) => statement
    .filter((token) => token.type === "word")
    .map((token) => token.value);
  const first = words(statements[0] ?? []);
  const last = words(statements.at(-1) ?? []);
  if (first.length !== 1 || first[0] !== "BEGIN" || last.length !== 1 || last[0] !== "COMMIT") {
    throw new Error("Migration transaction must be exactly one top-level BEGIN/COMMIT pair");
  }
  const transactionStarts = new Set([
    "BEGIN", "START", "COMMIT", "END", "ROLLBACK", "ABORT", "PREPARE",
  ]);
  if (statements.slice(1, -1).some((statement) => transactionStarts.has(words(statement)[0]))) {
    throw new Error("Nested or alternate top-level transaction control is forbidden");
  }
}

function assertSafeDestructiveOperations(sql) {
  const allowedConstraints = new Set([
    "administrative_ward_dataset_records:administrative_ward_dataset_r_dataset_release_id_province__fkey",
    "administrative_ward_dataset_records:administrative_ward_dataset_records_dataset_release_id_fkey",
    "administrative_ward_dataset_records:administrative_ward_dataset_records_province_code_fkey",
    "administrative_ward_dataset_records:administrative_ward_dataset_records_ward_code_fkey",
    "place_administrative_location_exceptions:place_administrative_location_exception_dataset_release_id_fkey",
    "place_administrative_location_exceptions:place_administrative_location_exceptions_place_id_fkey",
    "places:places_administrative_ward_code_fkey",
    "places:places_district_id_fkey",
    "places:places_province_code_fkey",
    "province_dataset_records:province_dataset_records_dataset_release_id_fkey",
    "province_dataset_records:province_dataset_records_province_code_fkey",
  ]);
  const allowedColumns = new Set([
    "place_administrative_location_exceptions:updated_at:DROP DEFAULT",
    "place_images:image_data:DROP NOT NULL",
    "bookings:status:DROP DEFAULT",
  ]);

  const isWord = (token, value) => token?.type === "word" && token.value === value;
  const identifier = (token) => token?.type === "identifier" ? token.value : null;
  const splitOperations = (tokens) => {
    const operations = [];
    let operation = [];
    let depth = 0;
    for (const token of tokens) {
      if (token.type === "symbol" && token.value === "(") depth += 1;
      if (token.type === "symbol" && token.value === ")") depth -= 1;
      if (token.type === "symbol" && token.value === "," && depth === 0) {
        operations.push(operation);
        operation = [];
      } else operation.push(token);
    }
    operations.push(operation);
    return operations;
  };

  for (const statement of splitTopLevelStatements(String(sql))) {
    for (let index = 0; index < statement.length; index += 1) {
      if (isWord(statement[index], "TRUNCATE")
          || (isWord(statement[index], "DELETE") && isWord(statement[index + 1], "FROM"))
          || (isWord(statement[index], "DROP") && [
            "SCHEMA", "TABLE", "TYPE", "COLUMN", "FUNCTION", "PROCEDURE", "EXTENSION", "INDEX",
          ].some((value) => isWord(statement[index + 1], value)))) {
        throw new Error("Unapproved destructive statement");
      }
    }

    const dropCount = statement.filter((token) => isWord(token, "DROP")).length;
    if (dropCount === 0) continue;
    if (!isWord(statement[0], "ALTER") || !isWord(statement[1], "TABLE")) {
      throw new Error("Unscoped destructive operation");
    }

    let tableIndex = 2;
    if ((identifier(statement[tableIndex]) === "public" || statement[tableIndex]?.raw === "public")
        && statement[tableIndex + 1]?.value === ".") tableIndex += 2;
    const table = identifier(statement[tableIndex]);
    if (!table) throw new Error("Unscoped destructive table operation");

    let recognizedDrops = 0;
    for (const operation of splitOperations(statement.slice(tableIndex + 1))) {
      if (!operation.some((token) => isWord(token, "DROP"))) continue;
      if (operation.length === 5
          && isWord(operation[0], "DROP")
          && isWord(operation[1], "CONSTRAINT")
          && isWord(operation[2], "IF")
          && isWord(operation[3], "EXISTS")
          && identifier(operation[4])) {
        if (!allowedConstraints.has(`${table}:${identifier(operation[4])}`)) {
          throw new Error("Unapproved destructive constraint operation");
        }
        recognizedDrops += 1;
        continue;
      }
      const column = identifier(operation[2]);
      const action = operation.slice(3).map((token) => token.value).join(" ");
      if (!isWord(operation[0], "ALTER")
          || !isWord(operation[1], "COLUMN")
          || !column
          || !allowedColumns.has(`${table}:${column}:${action}`)) {
        throw new Error("Unapproved destructive column operation");
      }
      recognizedDrops += 1;
    }
    if (recognizedDrops !== dropCount) throw new Error("Unscoped destructive operation");
  }
}

test("shared PostgreSQL lexer preserves boundaries while masking nested comments and literals", () => {
  const source = `COMMIT/* outer /* nested */ outer */WORK; SELECT 'DROP/**/TABLE', "DELETE/**/FROM"; DO $x$ DROP TABLE users; $x$;`;
  const { maskedSql, tokens } = lexPostgresTopLevel(source);
  assert.equal(maskedSql.length, source.length);
  assert.deepEqual(
    tokens.filter((token) => token.type === "word").map((token) => token.value),
    ["COMMIT", "WORK", "SELECT", "DO"],
  );
});

test("subscription baseline exists before subscription telemetry alters it", () => {
  const names = fs.readdirSync(migrationsRoot).sort();
  const createIndex = names.indexOf("20260713000000_create_subscription_baseline");
  const alterIndex = names.indexOf("20260714000000_add_subscription_limits_and_place_telemetry");
  assert.ok(createIndex >= 0, "subscription baseline migration is missing");
  assert.ok(createIndex < alterIndex, "subscription baseline must run before telemetry migration");
  const sql = fs.readFileSync(path.join(migrationsRoot, names[createIndex], "migration.sql"), "utf8");
  for (const table of ["subscription_plans", "subscriptions", "subscription_invoices", "subscription_stats"]) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS "${table}"`, "u"));
  }
});

test("reconciliation migration covers critical booking and financial schema", () => {
  const sql = reconciliationSql;
  for (const token of [
    '"BookingStatus"',
    '"BookingAction"',
    '"booking_model"',
    '"slot_duration_minutes"',
    '"place_resources"',
    '"business_blocked_dates"',
    '"booking_action_logs"',
    '"booking_transactions"',
    '"payment_webhook_logs"',
    '"financial_ledgers"',
    '"resource_id"',
    '"start_time"',
    '"end_time"',
    '"business_id"',
    '"idempotency_key"',
  ]) assert.ok(sql.includes(token), `missing migration token: ${token}`);

  for (const table of [
    "place_resources",
    "business_blocked_dates",
    "booking_action_logs",
    "booking_transactions",
    "payment_webhook_logs",
    "financial_ledgers",
  ]) assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS "${table}"`, "u"));
  for (const column of ["booking_model", "slot_duration_minutes"]) {
    assertTableAddsColumn("business_services", column);
  }
  for (const column of [
    "resource_id",
    "start_time",
    "end_time",
    "business_id",
    "idempotency_key",
  ]) assertTableAddsColumn("bookings", column);
});

test("reconciliation migration guards existing data and manually pushed objects", () => {
  const sql = reconciliationSql;

  const uncommentedSql = sql.replace(/^\s*--.*$/gmu, "");
  const trimmedSql = uncommentedSql.trim();
  assert.ok(trimmedSql.startsWith("BEGIN;"), "reconciliation must start a transaction");
  assert.ok(trimmedSql.endsWith("COMMIT;"), "reconciliation must commit its transaction");
  assert.equal((uncommentedSql.match(/^\s*BEGIN\s*;\s*$/gimu) ?? []).length, 1);
  assert.equal((uncommentedSql.match(/\bCOMMIT\s*;/giu) ?? []).length, 1);
  assert.doesNotMatch(
    uncommentedSql,
    /\b(?:ROLLBACK|ABORT|END\s+(?:WORK|TRANSACTION)|START\s+TRANSACTION|PREPARE\s+TRANSACTION)\b/iu,
  );
  assert.doesNotMatch(uncommentedSql, /\bTRUNCATE\b|\bDELETE\s+FROM\b/iu);

  for (const catalog of ["pg_type", "pg_class", "information_schema.columns", "pg_constraint"]) {
    assert.ok(sql.includes(catalog), `missing catalog guard: ${catalog}`);
  }
  assert.match(sql, /RAISE EXCEPTION[^;]*BookingStatus/is);
  assert.match(sql, /ALTER COLUMN "status" TYPE "BookingStatus"[\s\S]*USING/is);
  assert.match(sql, /GROUP BY[\s\S]*HAVING COUNT\(\*\) > 1[\s\S]*RAISE EXCEPTION/is);
  assert.doesNotMatch(
    uncommentedSql,
    /DROP\s+(?:SCHEMA|TABLE|TYPE|COLUMN|FUNCTION|PROCEDURE|EXTENSION)\b/iu,
  );
  assert.doesNotMatch(uncommentedSql, /\bDROP\s+INDEX\b/iu);
  assert.doesNotMatch(
    uncommentedSql,
    /\bDROP\s+(?!(?:CONSTRAINT\s+IF\s+EXISTS\s+"[^"]+"|DEFAULT\b|NOT\s+NULL\b))/iu,
  );

  const allowedConstraintDrops = [
    "administrative_ward_dataset_r_dataset_release_id_province__fkey",
    "administrative_ward_dataset_records_dataset_release_id_fkey",
    "administrative_ward_dataset_records_province_code_fkey",
    "administrative_ward_dataset_records_ward_code_fkey",
    "place_administrative_location_exception_dataset_release_id_fkey",
    "place_administrative_location_exceptions_place_id_fkey",
    "places_administrative_ward_code_fkey",
    "places_district_id_fkey",
    "places_province_code_fkey",
    "province_dataset_records_dataset_release_id_fkey",
    "province_dataset_records_province_code_fkey",
  ].sort();
  const actualConstraintDrops = [
    ...uncommentedSql.matchAll(/DROP CONSTRAINT IF EXISTS "([^"]+)"/gu),
  ].map((match) => match[1]).sort();
  assert.deepEqual(actualConstraintDrops, allowedConstraintDrops);

  const nullStatusPreflight = sql.indexOf("BookingStatus conversion refused: bookings.status contains NULL");
  const invalidStatusPreflight = sql.indexOf("unsupported bookings.status values");
  const statusCast = sql.indexOf('ALTER COLUMN "status" TYPE "BookingStatus"');
  assert.ok(nullStatusPreflight >= 0 && nullStatusPreflight < statusCast);
  assert.ok(invalidStatusPreflight >= 0 && invalidStatusPreflight < statusCast);

  for (const rawConstraint of [
    '"administrative_ward_boundarie_dataset_release_id_ward_code_fkey"',
    '"province_boundaries_dataset_release_id_province_code_fkey"',
  ]) assert.doesNotMatch(sql, new RegExp(`DROP CONSTRAINT(?: IF EXISTS)? ${rawConstraint}`, "u"));
  for (const unmanagedSearchIndex of [
    '"ward_records_search_trgm_idx"',
    '"province_records_search_trgm_idx"',
  ]) assert.doesNotMatch(
    sql,
    new RegExp(`DROP INDEX(?: IF EXISTS)?\\s+${unmanagedSearchIndex}`, "u"),
  );
  for (const protectedGeometryIndex of [
    '"administrative_ward_boundaries_geom_gist_idx"',
    '"province_boundaries_geom_gist_idx"',
  ]) assert.doesNotMatch(
    sql,
    new RegExp(`DROP INDEX(?: IF EXISTS)?\\s+${protectedGeometryIndex}`, "u"),
  );
});

test("reconciliation canonicalizes every historical booking financial row", () => {
  const sql = reconciliationSql;

  for (const column of ["admin_earned", "business_earned", "commission_rate"]) {
    assert.match(sql, new RegExp(`ADD COLUMN IF NOT EXISTS "${column}" INTEGER`, "u"));
    assert.doesNotMatch(
      sql,
      new RegExp(`ADD COLUMN IF NOT EXISTS "${column}" INTEGER NOT NULL DEFAULT`, "u"),
    );
  }
  assert.doesNotMatch(sql, /COALESCE\(b\."(?:admin_earned|business_earned|commission_rate)"/iu);
  assert.ok(sql.includes('SET "admin_earned" = b."commission_amount"'));
  assert.ok(sql.includes('"business_earned" = b."final_price" - b."commission_amount"'));
  assert.match(sql, /WHEN b\."final_price" = 0 THEN 0[\s\S]*ROUND\([\s\S]*b\."commission_amount" \* 100\.0[\s\S]*b\."final_price"[\s\S]*::INTEGER/iu);

  const canonicalUpdate = sql.match(
    /UPDATE "bookings" b\s+SET "admin_earned"[\s\S]*?;/iu,
  );
  assert.ok(canonicalUpdate, "missing canonical booking financial update");
  assert.doesNotMatch(canonicalUpdate[0], /\bWHERE\b|\bCOALESCE\b/iu);

  const rangePreflight = sql.indexOf("Booking financial backfill refused");
  const backfill = sql.indexOf('UPDATE "bookings" b\n  SET "admin_earned"');
  const nullPreflight = sql.indexOf("Cannot enforce booking financial fields");
  const notNull = sql.indexOf('ALTER COLUMN "admin_earned" SET NOT NULL');
  assert.ok(rangePreflight >= 0 && rangePreflight < backfill);
  assert.ok(backfill < nullPreflight && nullPreflight < notNull);
});

test("reconciliation derives category depth and role protection before enforcement", () => {
  const sql = reconciliationSql;

  assert.match(sql, /ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "level" INTEGER\s*;/iu);
  assert.doesNotMatch(
    sql,
    /ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "level" INTEGER NOT NULL DEFAULT/iu,
  );
  for (const message of ["orphan", "cycle", "depth exceeds 3"]) {
    assert.match(sql, new RegExp(`Category hierarchy[^']*${message}`, "iu"));
  }
  assert.match(sql, /WITH RECURSIVE\s+category_hierarchy/iu);
  const categoryUpdate = sql.indexOf('UPDATE "categories" category');
  const categoryDefault = sql.indexOf('ALTER COLUMN "level" SET DEFAULT 1');
  const categoryNotNull = sql.indexOf('ALTER COLUMN "level" SET NOT NULL');
  assert.ok(categoryUpdate >= 0 && categoryUpdate < categoryDefault);
  assert.ok(categoryDefault < categoryNotNull);

  assert.match(sql, /ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "is_protected" BOOLEAN\s*;/iu);
  assert.doesNotMatch(
    sql,
    /ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "is_protected" BOOLEAN NOT NULL DEFAULT/iu,
  );
  assert.match(sql, /UPDATE "roles"\s+SET "is_protected" = "is_system"/iu);
  const roleUpdate = sql.indexOf('UPDATE "roles"');
  const roleDefault = sql.indexOf('ALTER COLUMN "is_protected" SET DEFAULT false');
  const roleNotNull = sql.indexOf('ALTER COLUMN "is_protected" SET NOT NULL');
  assert.ok(roleUpdate >= 0 && roleUpdate < roleDefault);
  assert.ok(roleDefault < roleNotNull);
});

test("reconciliation validates same-name indexes and constraints before accepting them", () => {
  const sql = reconciliationSql;

  assert.match(sql, /pg_get_indexdef/iu);
  assert.match(sql, /Existing index % is incompatible/iu);
  assert.match(sql, /pg_get_constraintdef/iu);
  assert.match(sql, /Existing constraint %\.% is incompatible/iu);
  assert.match(
    sql,
    /namespace\.nspname = 'public'[\s\S]*relation\.relname = fk\.table_name[\s\S]*c\.conname = fk\.constraint_name/iu,
  );
  for (const catalogField of [
    "indclass",
    "indcollation",
    "indimmediate",
    "indisprimary",
    "indisexclusion",
    "conindid",
    "conpfeqop",
    "conppeqop",
    "conffeqop",
    "tgenabled",
  ]) assert.ok(sql.includes(catalogField), `missing catalog semantic: ${catalogField}`);
  assert.doesNotMatch(sql, /\w+\.indnullsnotdistinct\b/u);
  assert.match(sql, /to_jsonb\([^)]*\)\s*->>\s*'indnullsnotdistinct'/iu);
  assert.match(sql, /to_jsonb\([^)]*\)\s*->>\s*'conenforced'/iu);
  assert.match(
    sql,
    /supporting_index\.indnkeyatts[\s\S]*cardinality\(actual_referenced_keys\)/iu,
  );
});

test("SQL-aware transaction contract rejects every top-level alias and ignores quoted text", () => {
  const unsafeMutations = [
    reconciliationSql.replace(/^BEGIN;/u, "BEGIN WORK;"),
    reconciliationSql.replace(/^BEGIN;/u, "BEGIN TRANSACTION;"),
    reconciliationSql.replace(/^BEGIN;/u, "START TRANSACTION;"),
    reconciliationSql.replace(/\nCOMMIT;\s*$/u, "\nEND;"),
    reconciliationSql.replace(/\nCOMMIT;\s*$/u, "\nCOMMIT WORK;"),
    reconciliationSql.replace(/\nCOMMIT;\s*$/u, "\nCOMMIT TRANSACTION AND CHAIN;"),
    reconciliationSql.replace("\nCOMMIT;", "\nROLLBACK;\nCOMMIT;"),
    reconciliationSql.replace("\nCOMMIT;", "\nABORT;\nCOMMIT;"),
    reconciliationSql.replace("\nCOMMIT;", "\nPREPARE TRANSACTION 'task4';\nCOMMIT;"),
    reconciliationSql.replace(/\nCOMMIT;\s*$/u, "\nCOMMIT/**/WORK;"),
    reconciliationSql.replace("\nCOMMIT;", "\nSTART/**/TRANSACTION;\nCOMMIT;"),
    reconciliationSql.replace(
      /\nCOMMIT;\s*$/u,
      "\nCOMMIT/* outer /* nested */ still outer */WORK;",
    ),
    reconciliationSql.replace(
      "\nCOMMIT;",
      String.raw`
SELECT E'left\'quote\\tail';
START/**/TRANSACTION;
SELECT e'right\'quote\\tail';
COMMIT;`,
    ),
  ];
  for (const mutation of unsafeMutations) {
    assert.throws(() => assertSafeTopLevelMigration(mutation), /transaction/iu);
  }

  const quotedControls = reconciliationSql.replace(
    /\nCOMMIT;\s*$/u,
    `
DO $audit$
BEGIN
  RAISE NOTICE 'COMMIT AND CHAIN; ROLLBACK; DROP TABLE "users";';
END
$audit$;
-- START TRANSACTION; DELETE FROM "users";
COMMIT;`,
  );
  assert.doesNotThrow(() => assertSafeTopLevelMigration(quotedControls));
});

test("destructive contract is table/column scoped and rejects trailing bypasses", () => {
  const unsafeMutations = [
    reconciliationSql.replace(
      'ALTER TABLE "administrative_ward_dataset_records"',
      'ALTER TABLE "users"',
    ),
    reconciliationSql.replace(
      'DROP CONSTRAINT IF EXISTS "administrative_ward_dataset_records_ward_code_fkey";',
      'DROP CONSTRAINT IF EXISTS "administrative_ward_dataset_records_ward_code_fkey" CASCADE;',
    ),
    reconciliationSql.replace(
      "\nCOMMIT;",
      '\nALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;\nCOMMIT;',
    ),
    reconciliationSql.replace(
      'ALTER COLUMN "image_data" DROP NOT NULL;',
      'ALTER COLUMN "image_data" DROP NOT NULL CASCADE;',
    ),
    reconciliationSql.replace("\nCOMMIT;", '\nDROP TABLE "users";\nCOMMIT;'),
    reconciliationSql.replace("\nCOMMIT;", '\nTRUNCATE "users";\nCOMMIT;'),
    reconciliationSql.replace("\nCOMMIT;", '\nDELETE FROM "users";\nCOMMIT;'),
    reconciliationSql.replace("\nCOMMIT;", '\nDROP/**/TABLE "users";\nCOMMIT;'),
    reconciliationSql.replace("\nCOMMIT;", '\nDELETE/**/FROM "users";\nCOMMIT;'),
    reconciliationSql.replace(
      "\nCOMMIT;",
      '\nDROP/* outer /* nested */ still outer */TABLE "users";\nCOMMIT;',
    ),
    reconciliationSql.replace(
      "\nCOMMIT;",
      String.raw`
SELECT E'left\'quote\\tail';
DROP/**/TABLE "users";
SELECT e'right\'quote\\tail';
COMMIT;`,
    ),
    reconciliationSql.replace(
      "\nCOMMIT;",
      '-- PostgreSQL CR ends this comment\rDROP TABLE "users";\nCOMMIT;',
    ),
  ];
  for (const mutation of unsafeMutations) {
    assert.throws(() => assertSafeDestructiveOperations(mutation), /destructive/iu);
  }

  assert.doesNotThrow(() => assertSafeDestructiveOperations(reconciliationSql));
  const literalControls = reconciliationSql.replace(
    "\nCOMMIT;",
    `
SELECT 'DROP/**/TABLE users; DELETE/**/FROM users' AS "DROP/**/TABLE";
DO $ignored$
BEGIN
  RAISE NOTICE 'DROP TABLE users; DELETE FROM users;';
END
$ignored$;
COMMIT;`,
  );
  assert.doesNotThrow(() => assertSafeDestructiveOperations(literalControls));
  const escapeStringControls = reconciliationSql.replace(
    "\nCOMMIT;",
    String.raw`
SELECT E'escaped quote: \' DROP/**/TABLE users; slash: \\' AS payload;
SELECT e'ROLLBACK; DELETE/**/FROM users; escaped: \' and \\' AS payload;
COMMIT;`,
  );
  assert.doesNotThrow(() => assertSafeTopLevelMigration(escapeStringControls));
  assert.doesNotThrow(() => assertSafeDestructiveOperations(escapeStringControls));
});
