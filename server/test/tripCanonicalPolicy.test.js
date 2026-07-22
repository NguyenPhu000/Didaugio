import test from "node:test";
import assert from "node:assert/strict";
import { evaluateTripAccess, assertTripAccess, CAPABILITIES } from "../src/services/trip/tripAccessPolicy.service.js";

test("Trip Access Policy: owner has full access to private trip", () => {
  const privateTrip = {
    id: 101,
    userId: 5,
    isPublic: false,
    privacy: "private",
    metadata: {},
  };

  const readResult = evaluateTripAccess(5, privateTrip, CAPABILITIES.READ);
  assert.equal(readResult.allowed, true);

  const writeResult = evaluateTripAccess(5, privateTrip, CAPABILITIES.WRITE);
  assert.equal(writeResult.allowed, true);

  const executeResult = evaluateTripAccess(5, privateTrip, CAPABILITIES.EXECUTE);
  assert.equal(executeResult.allowed, true);
});

test("Trip Access Policy: non-owner cannot detail/mutate private trip", () => {
  const privateTrip = {
    id: 102,
    userId: 5,
    isPublic: false,
    privacy: "private",
    metadata: {},
  };

  const readResult = evaluateTripAccess(99, privateTrip, CAPABILITIES.READ);
  assert.equal(readResult.allowed, false);
  assert.equal(readResult.reason, "TRIP_ACCESS_DENIED");

  const writeResult = evaluateTripAccess(99, privateTrip, CAPABILITIES.WRITE);
  assert.equal(writeResult.allowed, false);

  assert.throws(
    () => assertTripAccess(99, privateTrip, CAPABILITIES.READ),
    (err) => err?.statusCode === 403 || err?.errorCode === "TRIP_ACCESS_DENIED" || err?.message?.includes("không có quyền")
  );
});

test("Trip Access Policy: public trip allows view/save but execution remains owner-only", () => {
  const publicTrip = {
    id: 103,
    userId: 5,
    metadata: { isPublic: true },
  };

  const readResult = evaluateTripAccess(99, publicTrip, CAPABILITIES.READ);
  assert.equal(readResult.allowed, true);

  const executeResult = evaluateTripAccess(null, publicTrip, CAPABILITIES.EXECUTE);
  assert.equal(executeResult.allowed, false);

  const saveResult = evaluateTripAccess(99, publicTrip, CAPABILITIES.SAVE);
  assert.equal(saveResult.allowed, true);

  // Non-owner still cannot mutate public trip
  const writeResult = evaluateTripAccess(99, publicTrip, CAPABILITIES.WRITE);
  assert.equal(writeResult.allowed, false);
});

test("Trip Access Policy: metadata sharedUserIds never grants access", () => {
  const sharedTrip = {
    id: 104,
    userId: 5,
    isPublic: false,
    privacy: "private",
    metadata: {
      sharedUserIds: [10, 12, 15],
    },
  };

  const sharedUserResult = evaluateTripAccess(12, sharedTrip, CAPABILITIES.READ);
  assert.equal(sharedUserResult.allowed, false);

  const unsharedUserResult = evaluateTripAccess(99, sharedTrip, CAPABILITIES.READ);
  assert.equal(unsharedUserResult.allowed, false);
});
