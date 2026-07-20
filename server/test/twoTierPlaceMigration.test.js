import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  classifyPlaceMapping,
  rankNearbyWardSuggestions,
} from "../src/services/location/placeAdministrativeMigration.domain.js";

test("accepts only one exact active ward match", () => {
  assert.deepEqual(classifyPlaceMapping({ coordinatesValid: true, matches: ["31117"] }), {
    status: "mapped",
    wardCode: "31117",
    reason: null,
  });

  assert.deepEqual(classifyPlaceMapping({ coordinatesValid: true, matches: [] }), {
    status: "exception",
    wardCode: null,
    reason: "zero_match",
  });

  assert.deepEqual(
    classifyPlaceMapping({ coordinatesValid: true, matches: ["31117", "31120"] }),
    { status: "exception", wardCode: null, reason: "multiple_matches" },
  );
});

test("invalid coordinates always enter the exception queue", () => {
  assert.deepEqual(classifyPlaceMapping({ coordinatesValid: false, matches: ["31117"] }), {
    status: "exception",
    wardCode: null,
    reason: "invalid_coordinate",
  });
});

test("nearby wards are suggestions only, sorted and limited to three", () => {
  const suggestions = rankNearbyWardSuggestions([
    { wardCode: "D", distanceMeters: 800 },
    { wardCode: "B", distanceMeters: 120 },
    { wardCode: "A", distanceMeters: 120 },
    { wardCode: "C", distanceMeters: 450 },
  ]);

  assert.deepEqual(suggestions, [
    { wardCode: "A", distanceMeters: 120 },
    { wardCode: "B", distanceMeters: 120 },
    { wardCode: "C", distanceMeters: 450 },
  ]);
});

test("backfill uses exact spatial coverage and never administrative name matching", async () => {
  const script = await readFile(
    new URL("../src/scripts/backfillPlaceAdministrativeLocation.js", import.meta.url),
    "utf8",
  );

  assert.match(script, /ST_Covers/i);
  assert.match(script, /cardinality\((?:work\.)?candidate_ward_codes\) = 1/i);
  assert.match(script, /ST_DWithin/i);
  assert.match(script, /ST_Distance/i);
  assert.match(script, /LIMIT 3/i);
  assert.doesNotMatch(script, /LIKE.*(?:ward|district)|name\s*=/i);
  const setClauses = [...script.matchAll(/\bSET\b([\s\S]*?)(?:\bFROM\b|\bWHERE\b)/giu)];
  for (const [, setClause] of setClauses) {
    assert.doesNotMatch(setClause, /district_id\s*=/i);
  }
});

test("release reconcile also revalidates canonical places without a legacy district", async () => {
  const script = await readFile(
    new URL("../src/scripts/backfillPlaceAdministrativeLocation.js", import.meta.url),
    "utf8",
  );
  assert.match(script, /LEFT JOIN districts_cantho/);
  assert.match(script, /d\.id IS NOT NULL OR p\.province_code = \$2/);
  assert.match(script, /SET province_code = \$1,[\s\S]*administrative_ward_code = NULL/);
});
