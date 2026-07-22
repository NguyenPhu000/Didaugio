import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (relative) => fs.readFileSync(path.resolve(relative), "utf8");
const executable = (source) => source
  .replace(/\/\*[\s\S]*?\*\//gu, "")
  .replace(/^\s*\/\/.*$/gmu, "");

test("TripPlan is the only runtime trip aggregate", () => {
  const schema = read("prisma/schema.prisma");
  assert.doesNotMatch(schema, /^model Trip\s*\{/mu);
  assert.doesNotMatch(schema, /^model TripDestination\s*\{/mu);
  assert.match(schema, /^model TripPlan\s*\{/mu);
  assert.match(schema, /trip\s+TripPlan\s+@relation/u);

  const runtime = executable([
    read("src/services/trip/trip.service.js"),
    read("src/services/trip/tripPlan.service.js"),
    read("src/services/trip/tripExecution.service.js"),
    read("src/services/booking/booking.service.js"),
    read("src/services/event/event.service.js"),
    read("src/services/cms/cms.service.js"),
  ].join("\n"));
  assert.doesNotMatch(runtime, /\b(?:prisma|tx)\.(?:trip|tripDestination)\b/u);
  assert.doesNotMatch(runtime, /legacyTripId|migratedFromTripId/u);
  assert.doesNotMatch(runtime, /createShadowTripPlan/u);
});

test("Trip API exposes canonical stop and share routes only", () => {
  const routes = read("src/routes/trip/trip.route.js");
  assert.doesNotMatch(routes, /\/destinations/u);
  assert.match(routes, /\/trips\/:tripId\/stops\/reorder/u);
  assert.match(routes, /\/trips\/share\/:shareId/u);

  const mobileEndpoints = read("../app/src/api/endpoints.js");
  const mobileApi = read("../app/src/modules/trips/api/tripsApi.js");
  assert.doesNotMatch(mobileEndpoints, /\/destinations/u);
  assert.match(mobileApi, /deleteTripShare\(shareId\)/u);
});

test("Trip migration is fail-closed and removes legacy tables", () => {
  const expand = read("prisma/migrations/20260722090000_trip_plan_canonical_expand/migration.sql");
  const contract = read("prisma/migrations/20260722100000_trip_plan_canonical_contract/migration.sql");
  for (const token of [
    "trip_legacy_maps",
    "client_request_id",
    "trip_execution_operations",
    'REFERENCES "trip_plans"',
  ]) assert.ok(expand.includes(token), `missing expand token: ${token}`);
  assert.match(expand, /JOIN "trips" legacy ON legacy\."id"::text = p\."metadata"->>'legacyTripId'/u);
  assert.match(expand, /migrationLegacyDestinationId/u);
  assert.match(expand, /- 'legacyTripId'/u);
  assert.match(contract, /legacy_trip_count <> mapping_count/u);
  assert.match(contract, /migrated_stop_count < legacy_stop_count/u);
  assert.match(contract, /DROP TABLE "trip_destinations"/u);
  assert.match(contract, /DROP TABLE "trips"/u);
});

test("mobile queues durable create and execution idempotency keys", () => {
  const offline = read("../app/src/modules/trips/hooks/useTripsOffline.js");
  const active = read("../app/src/modules/trips/hooks/useActiveTrip.js");
  assert.match(offline, /clientRequestId/u);
  assert.match(offline, /TRIP_ID_MAP/u);
  assert.match(active, /TRIP_SESSION_OUTBOX/u);
  assert.match(active, /operationId/u);
  assert.match(active, /baseVersion/u);
});
