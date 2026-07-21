import assert from "node:assert/strict";
import test from "node:test";

import {
  allowsCapacityOverbooking,
  buildBlockingBookingWhere,
  intervalsOverlap,
  isBlockingBooking,
  normalizeRequestedResourceId,
  resolveBookingModel,
  resolveOccupiedDurationMinutes,
  resolveOccupiedInterval,
} from "../src/services/booking/bookingPolicy.js";

test("occupied duration prefers slot duration, then service duration, then one hour", () => {
  assert.equal(resolveOccupiedDurationMinutes({ slotDurationMinutes: 45, durationMinutes: 90 }), 45);
  assert.equal(resolveOccupiedDurationMinutes({ slotDurationMinutes: 0, durationMinutes: 90 }), 90);
  assert.equal(resolveOccupiedDurationMinutes({ slotDurationMinutes: -1, durationMinutes: 0 }), 60);
});

test("occupied interval adds a non-negative buffer exactly once", () => {
  const startTime = new Date("2026-07-22T02:00:00.000Z");
  const interval = resolveOccupiedInterval(
    { slotDurationMinutes: 30, bufferMinutes: 15 },
    startTime,
  );

  assert.deepEqual(interval, {
    startTime,
    endTime: new Date("2026-07-22T02:45:00.000Z"),
  });
  assert.equal(
    resolveOccupiedInterval({ durationMinutes: 30, bufferMinutes: -15 }, startTime).endTime.toISOString(),
    "2026-07-22T02:30:00.000Z",
  );
});

test("only intersecting intervals overlap", () => {
  const base = {
    startTime: new Date("2026-07-22T02:00:00.000Z"),
    endTime: new Date("2026-07-22T03:00:00.000Z"),
  };

  assert.equal(
    intervalsOverlap(base, {
      startTime: new Date("2026-07-22T03:00:00.000Z"),
      endTime: new Date("2026-07-22T04:00:00.000Z"),
    }),
    false,
  );
  assert.equal(
    intervalsOverlap(base, {
      startTime: new Date("2026-07-22T02:30:00.000Z"),
      endTime: new Date("2026-07-22T03:30:00.000Z"),
    }),
    true,
  );
});

test("only active pending and confirmed bookings block", () => {
  assert.equal(isBlockingBooking({ status: "pending", deletedAt: null }), true);
  assert.equal(isBlockingBooking({ status: "confirmed", deletedAt: null }), true);
  assert.equal(isBlockingBooking({ status: "cancelled", deletedAt: null }), false);
  assert.equal(isBlockingBooking({ status: "pending", deletedAt: new Date() }), false);
});

test("blocking booking query scopes resource overlap and excludes one booking", () => {
  const startTime = new Date("2026-07-22T02:00:00.000Z");
  const endTime = new Date("2026-07-22T03:00:00.000Z");

  assert.deepEqual(buildBlockingBookingWhere({
    serviceId: 7,
    resourceId: 9,
    startTime,
    endTime,
    excludeBookingId: 11,
  }), {
    serviceId: 7,
    resourceId: 9,
    status: { in: ["pending", "confirmed"] },
    deletedAt: null,
    startTime: { not: null, lt: endTime },
    endTime: { not: null, gt: startTime },
    id: { not: 11 },
  });
});

test("resource model requires a positive integer resource ID", () => {
  assert.equal(resolveBookingModel({ bookingModel: "resource" }), "resource");
  assert.equal(resolveBookingModel({ bookingModel: "anything-else" }), "capacity");
  assert.throws(
    () => normalizeRequestedResourceId({ bookingModel: "resource" }, null),
    { code: "BOOKING_RESOURCE_REQUIRED" },
  );
  assert.throws(
    () => normalizeRequestedResourceId({ bookingModel: "resource" }, "4.5"),
    { code: "BOOKING_RESOURCE_REQUIRED" },
  );
  assert.equal(normalizeRequestedResourceId({ bookingModel: "resource" }, "4"), 4);
});

test("capacity model canonicalizes resource and only literal true enables overbooking", () => {
  assert.equal(normalizeRequestedResourceId({ bookingModel: "capacity" }, 7), null);
  assert.equal(allowsCapacityOverbooking({ allowOverbooking: true }), true);
  assert.equal(allowsCapacityOverbooking({ allowOverbooking: 1 }), false);
  assert.equal(allowsCapacityOverbooking({ allowOverbooking: "true" }), false);
  assert.equal(allowsCapacityOverbooking({}), false);
});
