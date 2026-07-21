import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const migrationsRoot = path.resolve("prisma/migrations");

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
  const sql = fs.readFileSync(
    path.join(migrationsRoot, "20260721010000_reconcile_prisma_schema", "migration.sql"),
    "utf8",
  );
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
  for (const column of [
    "booking_model",
    "slot_duration_minutes",
    "resource_id",
    "start_time",
    "end_time",
    "business_id",
    "idempotency_key",
  ]) assert.match(sql, new RegExp(`ADD COLUMN IF NOT EXISTS "${column}"`, "u"));
});

test("reconciliation migration guards existing data and manually pushed objects", () => {
  const sql = fs.readFileSync(
    path.join(migrationsRoot, "20260721010000_reconcile_prisma_schema", "migration.sql"),
    "utf8",
  );

  const trimmedSql = sql.trim();
  assert.ok(trimmedSql.startsWith("BEGIN;"), "reconciliation must start a transaction");
  assert.ok(trimmedSql.endsWith("COMMIT;"), "reconciliation must commit its transaction");

  for (const catalog of ["pg_type", "pg_class", "information_schema.columns", "pg_constraint"]) {
    assert.ok(sql.includes(catalog), `missing catalog guard: ${catalog}`);
  }
  assert.match(sql, /RAISE EXCEPTION[^;]*BookingStatus/is);
  assert.match(sql, /ALTER COLUMN "status" TYPE "BookingStatus"[\s\S]*USING/is);
  assert.match(sql, /GROUP BY[\s\S]*HAVING COUNT\(\*\) > 1[\s\S]*RAISE EXCEPTION/is);
  assert.doesNotMatch(
    sql,
    /DROP\s+(?:SCHEMA|TABLE|TYPE|COLUMN|FUNCTION|PROCEDURE|EXTENSION)\b/iu,
  );

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

test("reconciliation derives historical booking financial fields before enforcing them", () => {
  const sql = fs.readFileSync(
    path.join(migrationsRoot, "20260721010000_reconcile_prisma_schema", "migration.sql"),
    "utf8",
  );

  for (const column of ["admin_earned", "business_earned", "commission_rate"]) {
    assert.match(sql, new RegExp(`ADD COLUMN IF NOT EXISTS "${column}" INTEGER`, "u"));
    assert.doesNotMatch(
      sql,
      new RegExp(`ADD COLUMN IF NOT EXISTS "${column}" INTEGER NOT NULL DEFAULT`, "u"),
    );
  }
  assert.ok(sql.includes('COALESCE(b."admin_earned", b."commission_amount")'));
  assert.ok(sql.includes('COALESCE(b."business_earned", b."final_price" - b."commission_amount")'));
  assert.match(sql, /WHEN b\."final_price" = 0 THEN 0[\s\S]*ROUND\([\s\S]*b\."commission_amount" \* 100\.0[\s\S]*b\."final_price"[\s\S]*::INTEGER/iu);

  const rangePreflight = sql.indexOf("Booking financial backfill refused");
  const backfill = sql.indexOf('UPDATE "bookings" b\n  SET "admin_earned"');
  const nullPreflight = sql.indexOf("Cannot enforce booking financial fields");
  const notNull = sql.indexOf('ALTER COLUMN "admin_earned" SET NOT NULL');
  assert.ok(rangePreflight >= 0 && rangePreflight < backfill);
  assert.ok(backfill < nullPreflight && nullPreflight < notNull);
});
