import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

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

function splitTopLevelStatements(sql) {
  const statements = [];
  let statement = "";
  let index = 0;
  let state = "code";
  let blockCommentDepth = 0;
  let dollarTag = "";

  while (index < sql.length) {
    const current = sql[index];
    const next = sql[index + 1];

    if (state === "line-comment") {
      if (current === "\n") {
        statement += current;
        state = "code";
      }
      index += 1;
      continue;
    }
    if (state === "block-comment") {
      if (current === "/" && next === "*") {
        blockCommentDepth += 1;
        index += 2;
      } else if (current === "*" && next === "/") {
        blockCommentDepth -= 1;
        index += 2;
        if (blockCommentDepth === 0) state = "code";
      } else {
        index += 1;
      }
      continue;
    }
    if (state === "single-quote") {
      statement += current;
      if (current === "'" && next === "'") {
        statement += next;
        index += 2;
      } else {
        index += 1;
        if (current === "'") state = "code";
      }
      continue;
    }
    if (state === "double-quote") {
      statement += current;
      if (current === '"' && next === '"') {
        statement += next;
        index += 2;
      } else {
        index += 1;
        if (current === '"') state = "code";
      }
      continue;
    }
    if (state === "dollar-quote") {
      if (sql.startsWith(dollarTag, index)) {
        statement += dollarTag;
        index += dollarTag.length;
        state = "code";
      } else {
        statement += current;
        index += 1;
      }
      continue;
    }

    if (current === "-" && next === "-") {
      state = "line-comment";
      index += 2;
    } else if (current === "/" && next === "*") {
      state = "block-comment";
      blockCommentDepth = 1;
      index += 2;
    } else if (current === "'") {
      statement += current;
      state = "single-quote";
      index += 1;
    } else if (current === '"') {
      statement += current;
      state = "double-quote";
      index += 1;
    } else if (current === "$") {
      const match = sql.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/u);
      if (match) {
        dollarTag = match[0];
        statement += dollarTag;
        state = "dollar-quote";
        index += dollarTag.length;
      } else {
        statement += current;
        index += 1;
      }
    } else if (current === ";") {
      if (statement.trim()) statements.push(statement.trim());
      statement = "";
      index += 1;
    } else {
      statement += current;
      index += 1;
    }
  }

  if (state !== "code" && state !== "line-comment") {
    throw new Error(`Unterminated SQL ${state}`);
  }
  if (statement.trim()) statements.push(statement.trim());
  return statements;
}

function assertSafeTopLevelMigration(sql) {
  const statements = splitTopLevelStatements(String(sql));
  const transactionControl = /^(?:BEGIN(?:\s+(?:WORK|TRANSACTION))?|START\s+TRANSACTION|COMMIT(?:\s+(?:WORK|TRANSACTION))?(?:\s+AND(?:\s+NO)?\s+CHAIN)?|END(?:\s+(?:WORK|TRANSACTION))?(?:\s+AND(?:\s+NO)?\s+CHAIN)?|ROLLBACK|ABORT|PREPARE\s+TRANSACTION)\b/iu;
  if (statements[0] !== "BEGIN" || statements.at(-1) !== "COMMIT") {
    throw new Error("Migration transaction must be exactly one top-level BEGIN/COMMIT pair");
  }
  if (statements.slice(1, -1).some((statement) => transactionControl.test(statement))) {
    throw new Error("Nested or alternate top-level transaction control is forbidden");
  }
}

function executableSql(sql) {
  let output = "";
  let index = 0;
  let state = "code";
  let blockCommentDepth = 0;
  let dollarTag = "";
  while (index < sql.length) {
    const current = sql[index];
    const next = sql[index + 1];
    if (state === "line-comment") {
      if (current === "\n") {
        output += "\n";
        state = "code";
      }
      index += 1;
    } else if (state === "block-comment") {
      if (current === "/" && next === "*") {
        blockCommentDepth += 1;
        index += 2;
      } else if (current === "*" && next === "/") {
        blockCommentDepth -= 1;
        index += 2;
        if (blockCommentDepth === 0) state = "code";
      } else index += 1;
    } else if (state === "single-quote") {
      if (current === "'" && next === "'") index += 2;
      else {
        index += 1;
        if (current === "'") state = "code";
      }
    } else if (state === "double-quote") {
      output += current;
      if (current === '"' && next === '"') {
        output += next;
        index += 2;
      } else {
        index += 1;
        if (current === '"') state = "code";
      }
    } else if (state === "dollar-quote") {
      if (sql.startsWith(dollarTag, index)) {
        index += dollarTag.length;
        state = "code";
      } else {
        output += current;
        index += 1;
      }
    } else if (current === "-" && next === "-") {
      state = "line-comment";
      index += 2;
    } else if (current === "/" && next === "*") {
      state = "block-comment";
      blockCommentDepth = 1;
      index += 2;
    } else if (current === "'") {
      state = "single-quote";
      output += " ";
      index += 1;
    } else if (current === '"') {
      state = "double-quote";
      output += current;
      index += 1;
    } else if (current === "$") {
      const match = sql.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/u);
      if (match) {
        dollarTag = match[0];
        state = "dollar-quote";
        index += dollarTag.length;
      } else {
        output += current;
        index += 1;
      }
    } else {
      output += current;
      index += 1;
    }
  }
  return output;
}

function splitAlterOperations(body) {
  const operations = [];
  let start = 0;
  let depth = 0;
  let quoted = false;
  for (let index = 0; index < body.length; index += 1) {
    const current = body[index];
    if (current === '"') {
      if (quoted && body[index + 1] === '"') index += 1;
      else quoted = !quoted;
    } else if (!quoted && current === "(") depth += 1;
    else if (!quoted && current === ")") depth -= 1;
    else if (!quoted && depth === 0 && current === ",") {
      operations.push(body.slice(start, index).trim());
      start = index + 1;
    }
  }
  operations.push(body.slice(start).trim());
  return operations;
}

function assertSafeDestructiveOperations(sql) {
  const executable = executableSql(String(sql));
  if (/\b(?:TRUNCATE|DELETE\s+FROM|DROP\s+(?:SCHEMA|TABLE|TYPE|COLUMN|FUNCTION|PROCEDURE|EXTENSION|INDEX))\b/iu.test(executable)) {
    throw new Error("Unapproved destructive statement");
  }

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

  let recognizedDrops = 0;
  for (const match of executable.matchAll(/ALTER\s+TABLE\s+(?:"public"\.)?"([^"]+)"([\s\S]*?);/giu)) {
    const table = match[1];
    for (const operation of splitAlterOperations(match[2])) {
      if (!/\bDROP\b/iu.test(operation)) continue;
      let destructive = operation.match(/^DROP\s+CONSTRAINT\s+IF\s+EXISTS\s+"([^"]+)"$/iu);
      if (destructive) {
        if (!allowedConstraints.has(`${table}:${destructive[1]}`)) {
          throw new Error("Unapproved destructive constraint operation");
        }
        recognizedDrops += 1;
        continue;
      }
      destructive = operation.match(/^ALTER\s+COLUMN\s+"([^"]+)"\s+(DROP\s+(?:DEFAULT|NOT\s+NULL))$/iu);
      if (!destructive || !allowedColumns.has(`${table}:${destructive[1]}:${destructive[2].toUpperCase()}`)) {
        throw new Error("Unapproved destructive column operation");
      }
      recognizedDrops += 1;
    }
  }

  const totalDrops = (executable.match(/\bDROP\b/giu) ?? []).length;
  if (recognizedDrops !== totalDrops) {
    throw new Error("Unscoped destructive operation");
  }
}

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
  ];
  for (const mutation of unsafeMutations) {
    assert.throws(() => assertSafeDestructiveOperations(mutation), /destructive/iu);
  }

  assert.doesNotThrow(() => assertSafeDestructiveOperations(reconciliationSql));
});
