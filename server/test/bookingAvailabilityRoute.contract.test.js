import assert from "node:assert/strict";
import test from "node:test";

import prisma from "../src/config/prismaClient.js";
import bookingPublicRouter from "../src/routes/booking/bookingPublic.route.js";
import { getAvailableSlots } from "../src/services/booking/bookingAvailability.service.js";

function replaceMethod(target, key, replacement) {
  const original = target[key];
  target[key] = replacement;
  return () => {
    target[key] = original;
  };
}

function activeResource(overrides = {}) {
  return {
    id: 19,
    name: "Room A",
    code: "A",
    resourceType: "room",
    capacity: 4,
    status: "active",
    serviceId: 7,
    placeId: 13,
    ...overrides,
  };
}

function publicAvailabilityHandler() {
  const layer = bookingPublicRouter.stack.find(
    (candidate) => candidate.route?.path === "/availability/:serviceId",
  );
  return layer.route.stack[0].handle;
}

async function invokePublicAvailability({ serviceId, date }) {
  let response;
  await publicAvailabilityHandler()(
    { params: { serviceId }, query: { date } },
    {
      status(statusCode) {
        return {
          json(body) {
            response = { statusCode, body };
          },
        };
      },
      json(body) {
        response = { statusCode: 200, body };
      },
    },
    (error) => {
      throw error;
    },
  );
  return response;
}

test("public route returns stable 400 for non-positive serviceId and impossible date", async () => {
  assert.deepEqual(await invokePublicAvailability({ serviceId: "0", date: "2026-07-22" }), {
    statusCode: 400,
    body: { success: false, data: null, message: "serviceId không hợp lệ", errorCode: "INVALID_PARAMS" },
  });
  assert.deepEqual(await invokePublicAvailability({ serviceId: "7", date: "2026-02-30" }), {
    statusCode: 400,
    body: {
      success: false,
      data: null,
      message: "Định dạng date không hợp lệ (YYYY-MM-DD)",
      errorCode: "INVALID_PARAMS",
    },
  });
});

test("public availability rejects an impossible calendar date before querying the service", async () => {
  let serviceReads = 0;
  const restore = replaceMethod(prisma.businessService, "findUnique", async () => {
    serviceReads += 1;
    return null;
  });

  try {
    await assert.rejects(
      () => getAvailableSlots(7, "2026-02-30"),
      (error) => error?.statusCode === 400 && error?.errorCode === "INVALID_PARAMS",
    );
    assert.equal(serviceReads, 0);
  } finally {
    restore();
  }
});

test("public resource availability returns only active exact-service resources and their own occupancy", async () => {
  const restores = [];
  let bookingQuery;
  const bookingQueries = [];
  try {
    restores.push(replaceMethod(prisma.businessService, "findUnique", async () => ({
      id: 7,
      businessId: 11,
      placeId: 13,
      bookingModel: "resource",
      slotDurationMinutes: 60,
      durationMinutes: 45,
      bufferMinutes: 15,
    })));
    restores.push(replaceMethod(prisma.businessBlockedDate, "findFirst", async () => null));
    restores.push(replaceMethod(prisma.placeResource, "findMany", async () => [
      activeResource(),
      activeResource({ id: 20, status: "inactive", name: "Hidden" }),
      activeResource({ id: 21, serviceId: 8, name: "Other service" }),
    ]));
    restores.push(replaceMethod(prisma.booking, "findMany", async (args) => {
      bookingQuery = args;
      bookingQueries.push(args);
      return [
        {
          resourceId: 19,
          startTime: new Date("2026-07-22T02:00:00.000Z"),
          endTime: new Date("2026-07-22T03:15:00.000Z"),
        },
      ];
    }));

    const result = await getAvailableSlots(7, "2026-07-22");

    assert.deepEqual(result, {
      date: "2026-07-22",
      serviceId: 7,
      available: true,
      bookingModel: "resource",
      slotDurationMinutes: 60,
      bufferMinutes: 15,
      resources: [{
        id: 19,
        name: "Room A",
        code: "A",
        resourceType: "room",
        capacity: 4,
        bookedSlots: [{
          startTime: new Date("2026-07-22T02:00:00.000Z"),
          endTime: new Date("2026-07-22T03:15:00.000Z"),
        }],
      }],
    });
    assert.deepEqual(bookingQuery.where.resourceId, { in: [19] });
    assert.equal(bookingQuery.where.deletedAt, null);
    assert.equal(bookingQueries.length, 1);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test("capacity availability exposes a Vietnam-local minute key and canonical start bucket", async () => {
  const restores = [];
  try {
    restores.push(replaceMethod(prisma.businessService, "findUnique", async () => ({
      id: 7,
      businessId: 11,
      placeId: 13,
      maxCapacity: 2,
      bookingModel: "capacity",
      slotDurationMinutes: 60,
      bufferMinutes: 0,
    })));
    restores.push(replaceMethod(prisma.businessBlockedDate, "findFirst", async () => null));
    restores.push(replaceMethod(prisma.booking, "findMany", async () => []));

    const result = await getAvailableSlots(7, "2026-07-22");
    const slot = result.slots.find((item) => item.time === "09:00");

    assert.deepEqual(slot, {
      time: "09:00",
      startTime: "2026-07-22T02:00:00.000Z",
      available: true,
      remaining: 2,
      capacity: 2,
    });
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});
