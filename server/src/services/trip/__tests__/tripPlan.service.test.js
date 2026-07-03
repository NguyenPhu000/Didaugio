import test from "node:test";
import assert from "node:assert/strict";
import { makeTripPlanService } from "../tripPlan.service.js";

const makeTx = (overrides = {}) => {
  const calls = [];
  const tx = {
    calls,
    booking: {
      findUnique: async () => ({
        id: 99,
        bookingCode: "BK001",
        userId: 7,
        serviceId: 3,
        useDate: new Date("2026-07-03T00:00:00.000Z"),
        useTime: "09:00",
        endTimeStr: "10:00",
        status: "confirmed",
        paymentStatus: "paid",
        service: { id: 3, placeId: 42, businessId: 5 },
        tripLink: null,
      }),
    },
    tripPlan: {
      findUnique: async () => ({
        id: 11,
        userId: 7,
        startDate: new Date("2026-07-02T00:00:00.000Z"),
        endDate: new Date("2026-07-04T00:00:00.000Z"),
        totalDays: 3,
        stops: [],
      }),
      update: async ({ data, include }) => ({
        id: 11,
        userId: 7,
        ...data,
        stops: include?.stops ? [] : undefined,
      }),
    },
    user: {
      findUnique: async () => ({ id: 7, role: { name: "user" } }),
    },
    tripStop: {
      findFirst: async () => ({ sequence: 2 }),
      create: async ({ data }) => {
        calls.push(["tripStop.create", data]);
        return {
          id: 123,
          placeId: data.placeId,
          dayNumber: data.dayNumber,
          fulfillmentStatus: data.fulfillmentStatus,
        };
      },
      update: async ({ where, data }) => {
        calls.push(["tripStop.update", { where, data }]);
        return { id: where.id, ...data };
      },
      findMany: async () => [],
    },
    bookingTripLink: {
      upsert: async ({ create }) => {
        calls.push(["bookingTripLink.upsert", create]);
        return {
          bookingId: create.bookingId,
          tripId: create.tripId,
          stopId: create.stopId,
          status: create.status,
        };
      },
    },
    domainJob: {
      create: async ({ data }) => {
        calls.push(["domainJob.create", data]);
        return { id: 1, ...data };
      },
    },
    $queryRaw: async () => [{ id: 11 }],
    ...overrides,
  };

  return tx;
};

const makePrisma = (tx) => ({
  $transaction: async (callback) => callback(tx),
});

test("linkBookingToTrip creates a TripStop when no matching stop exists", async () => {
  const tx = makeTx();
  const service = makeTripPlanService(makePrisma(tx));

  const result = await service.linkBookingToTrip({
    bookingId: 99,
    tripId: 11,
    actorUserId: 7,
  });

  assert.deepEqual(result, {
    bookingId: 99,
    tripId: 11,
    stopId: 123,
    linkStatus: "linked",
    stopCreated: true,
  });

  const stopCreate = tx.calls.find(([name]) => name === "tripStop.create");
  assert.equal(stopCreate[1].sequence, 3);
  assert.equal(stopCreate[1].dayNumber, 2);
  assert.equal(stopCreate[1].placeId, 42);
  assert.equal(stopCreate[1].fulfillmentStatus, "scheduled");
});

test("linkBookingToTrip rejects booking outside trip range by default", async () => {
  const tx = makeTx({
    booking: {
      findUnique: async () => ({
        id: 99,
        bookingCode: "BK001",
        userId: 7,
        useDate: new Date("2026-07-09T00:00:00.000Z"),
        useTime: "09:00",
        endTimeStr: "10:00",
        status: "confirmed",
        paymentStatus: "paid",
        service: { id: 3, placeId: 42, businessId: 5 },
      }),
    },
  });
  const service = makeTripPlanService(makePrisma(tx));

  await assert.rejects(
    () =>
      service.linkBookingToTrip({
        bookingId: 99,
        tripId: 11,
        actorUserId: 7,
      }),
    (error) => error.errorCode === "BOOKING_OUTSIDE_TRIP_RANGE",
  );
});

test("reorderDestinations writes temporary sequences then final sequences and queues route rebuild", async () => {
  const tx = makeTx({
    tripStop: {
      findMany: async () => [
        { id: 1, dayNumber: 1, sequence: 1 },
        { id: 2, dayNumber: 1, sequence: 2 },
      ],
      update: async ({ where, data }) => {
        tx.calls.push(["tripStop.update", { where, data }]);
        return { id: where.id, ...data };
      },
    },
  });
  const service = makeTripPlanService(makePrisma(tx));

  const result = await service.reorderDestinations({
    tripId: 11,
    actorUserId: 7,
    updates: [
      { stopId: 2, dayNumber: 1, sequence: 1 },
      { stopId: 1, dayNumber: 1, sequence: 2 },
    ],
  });

  assert.deepEqual(result, {
    tripId: 11,
    updatedCount: 2,
    routeRebuildQueued: true,
  });

  const updates = tx.calls.filter(([name]) => name === "tripStop.update");
  assert.equal(updates.length, 4);
  assert.equal(updates[0][1].data.sequence, 100001);
  assert.equal(updates[1][1].data.sequence, 100002);
  assert.deepEqual(updates[2][1].data, { dayNumber: 1, sequence: 1 });
  assert.deepEqual(updates[3][1].data, { dayNumber: 1, sequence: 2 });

  const job = tx.calls.find(([name]) => name === "domainJob.create");
  assert.equal(job[1].type, "RebuildRouteMetrics");
  assert.equal(job[1].aggregateId, 11);
});
