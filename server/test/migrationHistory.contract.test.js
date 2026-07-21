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
