import assert from "node:assert/strict";
import test from "node:test";

import { createBookingSchema } from "../src/models/schemas/booking/booking.schema.js";
import prisma from "../src/config/prismaClient.js";
import {
  checkAvailability,
  getAvailableSlots,
} from "../src/services/booking/bookingAvailability.service.js";
import { create as createBooking } from "../src/services/booking/booking.service.js";
import { rescheduleBooking } from "../src/services/booking/bookingSchedule.service.js";

const bookingAt = new Date("2026-07-22T02:00:00.000Z");

function resourceService(overrides = {}) {
  return {
    id: 7,
    businessId: 11,
    placeId: 13,
    maxCapacity: 99,
    bookingModel: "resource",
    slotDurationMinutes: 30,
    durationMinutes: 60,
    bufferMinutes: 15,
    allowOverbooking: false,
    ...overrides,
  };
}

function makeTx({ service = resourceService(), resource = null, bookings = [], blocked = null } = {}) {
  const rawLocks = [];
  const calls = { aggregate: [], findMany: [], blockedDates: [] };
  return {
    rawLocks,
    calls,
    $executeRaw: async (strings, ...values) => {
      rawLocks.push({ sql: String.raw({ raw: strings }), values });
    },
    businessService: {
      findUnique: async () => service,
    },
    placeResource: {
      findUnique: async () => resource,
    },
    businessBlockedDate: {
      findFirst: async (args) => {
        calls.blockedDates.push(args);
        return blocked;
      },
    },
    booking: {
      findMany: async (args) => {
        calls.findMany.push(args);
        return bookings;
      },
      aggregate: async (args) => {
        calls.aggregate.push(args);
        return { _sum: { quantity: 0 } };
      },
    },
  };
}

test("resource availability requires a requested resource after locking the service", async () => {
  const tx = makeTx();

  const result = await checkAvailability(tx, {
    serviceId: 7,
    bookingAt,
    quantity: 1,
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "RESOURCE_REQUIRED");
  assert.match(tx.rawLocks[0].sql, /business_services/i);
  assert.equal(tx.rawLocks.length, 1);
});

test("resource availability rejects inactive, wrong-service, and wrong-place resources", async () => {
  for (const resource of [
    { id: 19, status: "inactive", serviceId: 7, placeId: 13, capacity: null },
    { id: 19, status: "active", serviceId: 8, placeId: 13, capacity: null },
    { id: 19, status: "active", serviceId: 7, placeId: 14, capacity: null },
  ]) {
    const tx = makeTx({ resource });
    const result = await checkAvailability(tx, {
      serviceId: 7,
      bookingAt,
      quantity: 1,
      resourceId: 19,
    });

    assert.equal(result.ok, false);
    assert.equal(result.reason, "RESOURCE_INVALID");
    assert.match(tx.rawLocks[1].sql, /place_resources/i);
  }
});

test("resource availability rejects quantities above a positive resource capacity", async () => {
  const tx = makeTx({
    resource: { id: 19, status: "active", serviceId: 7, placeId: 13, capacity: 2 },
  });

  const result = await checkAvailability(tx, {
    serviceId: 7,
    bookingAt,
    quantity: 3,
    resourceId: 19,
  });

  assert.deepEqual(result, {
    ok: false,
    used: 0,
    capacity: 2,
    reason: "RESOURCE_INVALID",
  });
});

test("resource availability still honors a blocked booking date after resource validation", async () => {
  const tx = makeTx({
    resource: { id: 19, status: "active", serviceId: 7, placeId: 13, capacity: null },
    blocked: { id: 29 },
  });

  const result = await checkAvailability(tx, {
    serviceId: 7,
    bookingAt,
    quantity: 1,
    resourceId: 19,
  });

  assert.deepEqual(result, {
    ok: false,
    used: 0,
    capacity: 0,
    reason: "BLOCKED_DATE",
  });
});

test("resource blocked-date lookup uses the Vietnam calendar date key", async () => {
  const tx = makeTx({
    resource: { id: 19, status: "active", serviceId: 7, placeId: 13, capacity: null },
    blocked: { id: 29 },
  });

  await checkAvailability(tx, {
    serviceId: 7,
    bookingAt: new Date("2026-07-21T17:30:00.000Z"),
    quantity: 1,
    resourceId: 19,
  });

  assert.deepEqual(
    tx.calls.blockedDates[0].where.date,
    new Date("2026-07-22T12:00:00.000Z"),
  );
});

test("capacity blocked-date lookup uses the Vietnam calendar date key", async () => {
  const tx = makeTx({
    service: resourceService({ bookingModel: "capacity", maxCapacity: 2 }),
    blocked: { id: 29 },
  });

  await checkAvailability(tx, {
    serviceId: 7,
    bookingAt: new Date("2026-07-21T17:30:00.000Z"),
    quantity: 1,
  });

  assert.deepEqual(
    tx.calls.blockedDates[0].where.date,
    new Date("2026-07-22T12:00:00.000Z"),
  );
});

test("public availability returns unavailable empty slots for a Vietnam-local blocked date", async () => {
  const restore = [];
  let blockedLookup;
  try {
    restore.push(replaceMethod(prisma.businessService, "findUnique", async () => ({
      id: 7,
      businessId: 11,
      maxCapacity: 2,
      bookingModel: "capacity",
      slotDurationMinutes: 30,
      bufferMinutes: 0,
    })));
    restore.push(replaceMethod(prisma.businessBlockedDate, "findFirst", async (args) => {
      blockedLookup = args;
      return { id: 29 };
    }));

    const result = await getAvailableSlots(7, "2026-07-22");

    assert.deepEqual(result, {
      date: "2026-07-22",
      serviceId: 7,
      available: false,
      reason: "BLOCKED_DATE",
      slots: [],
    });
    assert.deepEqual(
      blockedLookup.where.date,
      new Date("2026-07-22T12:00:00.000Z"),
    );
  } finally {
    restore.reverse().forEach((fn) => fn());
  }
});

test("resource overlap query is isolated to an active nondeleted resource and returns canonical interval", async () => {
  const tx = makeTx({
    resource: { id: 19, status: "active", serviceId: 7, placeId: 13, capacity: null },
  });

  const result = await checkAvailability(tx, {
    serviceId: 7,
    bookingAt,
    quantity: 1,
    resourceId: 19,
    excludeBookingId: 41,
  });

  assert.equal(result.ok, true);
  assert.equal(result.resourceId, 19);
  assert.deepEqual(result.startTime, bookingAt);
  assert.deepEqual(result.endTime, new Date("2026-07-22T02:45:00.000Z"));
  assert.deepEqual(tx.calls.findMany[0].where, {
    serviceId: 7,
    resourceId: 19,
    status: { in: ["pending", "confirmed"] },
    deletedAt: null,
    startTime: { not: null, lt: new Date("2026-07-22T02:45:00.000Z") },
    endTime: { not: null, gt: bookingAt },
    id: { not: 41 },
  });
});

test("capacity availability ignores resource fields, timestamps, and deleted bookings", async () => {
  const tx = makeTx({
    service: resourceService({ bookingModel: "capacity", maxCapacity: 2 }),
  });

  const result = await checkAvailability(tx, {
    serviceId: 7,
    bookingAt,
    quantity: 1,
    resourceId: 19,
  });

  assert.deepEqual(
    { resourceId: result.resourceId, startTime: result.startTime, endTime: result.endTime },
    { resourceId: null, startTime: null, endTime: null },
  );
  assert.equal(tx.calls.aggregate[0].where.deletedAt, null);
});

test("create booking schema accepts only a positive optional resource ID", () => {
  assert.equal(
    createBookingSchema.parse({ serviceId: 7, resourceId: "19" }).resourceId,
    19,
  );
  assert.throws(
    () => createBookingSchema.parse({ serviceId: 7, resourceId: 0 }),
  );
});

function replaceMethod(target, key, replacement) {
  const original = target[key];
  target[key] = replacement;
  return () => {
    target[key] = original;
  };
}

function validResource() {
  return { id: 19, status: "active", serviceId: 7, placeId: 13, capacity: 4 };
}

test("create persists the availability command's canonical resource and interval", async () => {
  const restore = [];
  let createdData;
  const service = resourceService({
    isActive: true,
    place: { id: 13, status: "approved", businessId: 11 },
    business: { id: 11, ownerId: 5, status: "approved" },
    price: 100,
    salePrice: null,
  });
  const tx = makeTx({ service, resource: validResource() });
  tx.booking.create = async ({ data }) => {
    createdData = data;
    return {
      ...data,
      id: 101,
      createdAt: new Date(),
      user: { id: 2, email: "guest@example.test", profile: {} },
      service,
    };
  };

  try {
    restore.push(replaceMethod(prisma.user, "findUnique", async () => ({
      id: 2,
      email: "guest@example.test",
      profile: { fullName: "Guest", phone: "0900000000" },
    })));
    restore.push(replaceMethod(prisma.businessService, "findUnique", async () => service));
    restore.push(replaceMethod(prisma.booking, "findFirst", async () => null));
    restore.push(replaceMethod(prisma.booking, "count", async () => 0));
    restore.push(replaceMethod(prisma.subscription, "findUnique", async () => ({
      status: "active",
      plan: { maxBookings: 10, features: [] },
    })));
    restore.push(replaceMethod(prisma, "$transaction", async (callback) => callback(tx)));

    await createBooking({
      serviceId: 7,
      resourceId: "19",
      useDate: "2026-07-22",
      useTime: "09:00",
      quantity: 1,
      guestName: "Guest",
      guestPhone: "0900000000",
    }, 2);

    assert.equal(createdData.resourceId, 19);
    assert.deepEqual(createdData.startTime, new Date("2026-07-22T02:00:00.000Z"));
    assert.deepEqual(createdData.endTime, new Date("2026-07-22T02:45:00.000Z"));
  } finally {
    restore.reverse().forEach((fn) => fn());
  }
});

test("reschedule keeps the resource and writes the availability command's canonical interval", async () => {
  const restore = [];
  let updatedData;
  const service = resourceService();
  const existing = {
    id: 41,
    serviceId: 7,
    resourceId: 19,
    quantity: 1,
    status: "pending",
    bookingAt,
    service,
  };
  const tx = makeTx({ service, resource: validResource() });
  tx.booking.findUnique = async () => existing;
  tx.booking.findMany = async () => [];
  tx.booking.update = async ({ data }) => {
    updatedData = data;
    return { ...existing, ...data, bookingCode: "BK-41", userId: 2 };
  };
  tx.bookingActionLog = { create: async () => ({}) };

  try {
    restore.push(replaceMethod(prisma, "$transaction", async (callback) => callback(tx)));

    await rescheduleBooking(41, "2026-07-22T03:00:00.000Z", 5);

    assert.equal(updatedData.resourceId, 19);
    assert.deepEqual(updatedData.startTime, new Date("2026-07-22T03:00:00.000Z"));
    assert.deepEqual(updatedData.endTime, new Date("2026-07-22T03:45:00.000Z"));
  } finally {
    restore.reverse().forEach((fn) => fn());
  }
});

test("create rejects an impossible raw calendar date before the first Prisma read", async () => {
  let prismaReads = 0;
  const restore = replaceMethod(prisma.user, "findUnique", async () => {
    prismaReads += 1;
    throw new Error("Prisma must not be read for invalid calendar input");
  });

  try {
    await assert.rejects(
      () => createBooking({ serviceId: 7, useDate: "2026-02-30", useTime: "09:00" }, 2),
      (error) => error?.errorCode === "VALIDATION_ERROR" && error?.statusCode === 400,
    );
    assert.equal(prismaReads, 0);
  } finally {
    restore();
  }
});
