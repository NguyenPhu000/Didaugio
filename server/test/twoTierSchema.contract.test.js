import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const adminMigrationUrl = new URL(
  "../prisma/migrations/20260720150000_two_tier_admin_expand/migration.sql",
  import.meta.url,
);
const placeMigrationUrl = new URL(
  "../prisma/migrations/20260720151000_place_canonical_location_expand/migration.sql",
  import.meta.url,
);

test("admin migration stores immutable release-scoped records", async () => {
  const sql = await readFile(adminMigrationUrl, "utf8");

  assert.match(sql, /CREATE SCHEMA IF NOT EXISTS vn_admin_source/i);
  assert.match(sql, /UNIQUE \(source_repo, source_commit\)/i);
  assert.match(sql, /PRIMARY KEY \(dataset_release_id, province_code\)/i);
  assert.match(sql, /PRIMARY KEY \(dataset_release_id, ward_code\)/i);
  assert.match(sql, /WHERE is_active/i);
  assert.match(sql, /CHECK \(administrative_type IN \('ward', 'commune', 'special_region'\)\)/i);
});

test("place expansion is additive and keeps legacy location columns", async () => {
  const sql = await readFile(placeMigrationUrl, "utf8");

  assert.match(sql, /ADD COLUMN province_code varchar\(20\)/i);
  assert.match(sql, /ADD COLUMN administrative_ward_code varchar\(20\)/i);
  assert.doesNotMatch(sql, /DROP COLUMN (district_id|ward_id)/i);
  assert.match(sql, /place_administrative_location_exceptions/i);
  assert.match(sql, /candidate_ward_codes varchar\(20\)\[\]/i);
  assert.match(sql, /suggested_wards jsonb/i);
});

test("an audited immutable release can be activated without re-importing it", async () => {
  const script = await readFile(
    new URL("../src/scripts/importVietnamAdministrativeDataset.js", import.meta.url),
    "utf8",
  );
  assert.match(script, /activatedExistingRelease:\s*true/);
  assert.match(script, /ADMIN_DATA_ACTIVATION_APPROVED/);
  assert.match(script, /Existing release .* is incomplete and cannot be activated/);
});
