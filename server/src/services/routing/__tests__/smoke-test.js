/**
 * Smoke test cho routing system.
 * Chạy: node server/src/services/routing/__tests__/smoke-test.js
 */

async function runSmokeTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ ${message}`);
      passed++;
    } else {
      console.log(`  ❌ ${message}`);
      failed++;
    }
  }

  console.log("\n=== Routing Smoke Tests ===\n");

  // Test 1: Module imports
  console.log("1. Module imports:");
  try {
    const routingService = (await import("../routing.service.js")).default;
    assert(!!routingService, "routing.service.js loaded");
    assert(typeof routingService.calculate === "function", "has calculate method");
    assert(typeof routingService.calculateTable === "function", "has calculateTable method");
    assert(typeof routingService.calculateLegsOptimized === "function", "has calculateLegsOptimized method");
  } catch (e) {
    assert(false, `routing.service.js import failed: ${e.message}`);
  }

  try {
    const tableApi = await import("../tableApi.js");
    assert(typeof tableApi.calculateTable === "function", "tableApi.calculateTable exported");
    assert(typeof tableApi.calculateSequentialLegs === "function", "tableApi.calculateSequentialLegs exported");
  } catch (e) {
    assert(false, `tableApi.js import failed: ${e.message}`);
  }

  try {
    const pseudoTraffic = await import("../pseudoTraffic.js");
    assert(typeof pseudoTraffic.getTrafficFactor === "function", "pseudoTraffic.getTrafficFactor exported");
    assert(typeof pseudoTraffic.applyTrafficToResponse === "function", "pseudoTraffic.applyTrafficToResponse exported");
  } catch (e) {
    assert(false, `pseudoTraffic.js import failed: ${e.message}`);
  }

  // Test 2: Pseudo-traffic
  console.log("\n2. Pseudo-traffic:");
  const { getTrafficFactor, applyTrafficFactor, applyTrafficToResponse } = await import("../pseudoTraffic.js");

  const morningRush = new Date("2026-05-20T07:30:00");
  const rushFactor = getTrafficFactor(morningRush);
  assert(rushFactor.factor >= 1.2, `Morning rush factor >= 1.2 (got ${rushFactor.factor})`);
  assert(rushFactor.label === "Cao điểm", `Morning rush label = "Cao điểm" (got "${rushFactor.label}")`);

  const midnight = new Date("2026-05-20T02:00:00");
  const nightFactor = getTrafficFactor(midnight);
  assert(nightFactor.factor <= 0.8, `Midnight factor <= 0.8 (got ${nightFactor.factor})`);

  const adjusted = applyTrafficFactor(1800, morningRush);
  assert(adjusted.adjustedDuration > 1800, `Rush hour adjusts 30min UP (got ${adjusted.adjustedDuration}s)`);

  const mockResponse = {
    routes: [{ distance: 1000, duration: 120, durationInTraffic: 120 }],
  };
  const withTraffic = applyTrafficToResponse(mockResponse, morningRush);
  assert(withTraffic.routes[0].durationInTraffic > 120, "applyTrafficToResponse modifies durationInTraffic");
  assert(!!withTraffic.routes[0].trafficInfo, "applyTrafficToResponse adds trafficInfo");

  // Test 3: Polyline6
  console.log("\n3. Polyline6 encode/decode:");
  const { encodePolyline6, decodePolyline6 } = await import("../polylineSimplifier.js");

  const points = [
    { lat: 10.0342, lng: 105.7793 },
    { lat: 10.0452, lng: 105.7469 },
  ];
  const encoded = encodePolyline6(points);
  assert(typeof encoded === "string" && encoded.length > 0, `Encoded to string (${encoded.length} chars)`);

  const decoded = decodePolyline6(encoded);
  assert(decoded.length === 2, `Decoded back to 2 points`);
  assert(
    Math.abs(decoded[0].lat - 10.0342) < 0.001,
    `First point lat ~ 10.0342 (got ${decoded[0].lat})`
  );

  // Test 4: Schema validation
  console.log("\n4. Schema validation:");
  try {
    const schemas = await import("../../../models/schemas/routing/routing.schema.js");
    const tableSchema = schemas.routingTableSchema;

    const valid = tableSchema.parse({
      waypoints: [
        { lat: 10.0342, lng: 105.7793 },
        { lat: 10.0452, lng: 105.7469 },
      ],
      mode: "motorcycle",
    });
    assert(valid.waypoints.length === 2, "Valid table schema parses");
    assert(valid.mode === "motorcycle", "Mode preserved");

    // Invalid: only 1 waypoint
    try {
      tableSchema.parse({ waypoints: [{ lat: 10.0342, lng: 105.7793 }] });
      assert(false, "Should have rejected 1 waypoint");
    } catch (e) {
      assert(true, "Correctly rejected 1 waypoint (min 2 required)");
    }
  } catch (e) {
    assert(false, `Schema test failed: ${e.message}`);
  }

  // Summary
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runSmokeTests().catch((e) => {
  console.error("Smoke test crashed:", e);
  process.exit(1);
});
