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
