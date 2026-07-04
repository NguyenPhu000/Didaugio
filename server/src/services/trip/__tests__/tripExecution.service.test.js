import test from "node:test";
import assert from "node:assert/strict";
import { TripExecutionService } from "../tripExecution.service.js";

// Tạo mock prisma client đơn giản
const createMockPrisma = (overrides = {}) => {
  const calls = [];
  const db = {
    tripPlanList: [],
    tripStopList: [],
    tripExecutionSessionList: [],
    tripList: [],
  };

  const prisma = {
    calls,
    db,
    tripPlan: {
      findFirst: async ({ where }) => {
        calls.push(["tripPlan.findFirst", where]);
        // Tìm trực tiếp
        if (where.id) {
          return db.tripPlanList.find((p) => p.id === where.id && p.userId === where.userId) || null;
        }
        // Tìm theo legacyId lưu trong metadata
        if (where.metadata?.path?.[0] === "legacyTripId") {
          const val = where.metadata.equals;
          return db.tripPlanList.find((p) => p.metadata?.legacyTripId === val && p.userId === where.userId) || null;
        }
        return null;
      },
      create: async ({ data }) => {
        calls.push(["tripPlan.create", data]);
        const newPlan = { id: db.tripPlanList.length + 1, ...data };
        db.tripPlanList.push(newPlan);
        return newPlan;
      },
    },
    trip: {
      findFirst: async ({ where }) => {
        calls.push(["trip.findFirst", where]);
        return db.tripList.find((t) => t.id === where.id && t.userId === where.userId) || null;
      },
    },
    tripStop: {
      findFirst: async ({ where }) => {
        calls.push(["tripStop.findFirst", where]);
        if (where.id && where.tripId) {
          return db.tripStopList.find((s) => s.id === where.id && s.tripId === where.tripId) || null;
        }
        if (where.tripId && where.metadata?.path?.[0] === "legacyDestinationId") {
          const val = where.metadata.equals;
          return db.tripStopList.find((s) => s.tripId === where.tripId && s.metadata?.legacyDestinationId === val) || null;
        }
        return null;
      },
      createMany: async ({ data }) => {
        calls.push(["tripStop.createMany", data]);
        data.forEach((s) => {
          db.tripStopList.push({ id: db.tripStopList.length + 1, ...s });
        });
        return { count: data.length };
      },
    },
    tripExecutionSession: {
      findFirst: async ({ where }) => {
        calls.push(["tripExecutionSession.findFirst", where]);
        return db.tripExecutionSessionList.find((s) => s.tripId === where.tripId && s.userId === where.userId) || null;
      },
      create: async ({ data }) => {
        calls.push(["tripExecutionSession.create", data]);
        const newSession = { id: db.tripExecutionSessionList.length + 1, ...data };
        db.tripExecutionSessionList.push(newSession);
        return newSession;
      },
      update: async ({ where, data }) => {
        calls.push(["tripExecutionSession.update", { where, data }]);
        const session = db.tripExecutionSessionList.find((s) => s.id === where.id);
        if (session) {
          Object.assign(session, data);
        }
        return session;
      },
    },
    $transaction: async (fn) => {
      calls.push(["$transaction"]);
      return fn(prisma);
    },
    ...overrides,
  };

  return prisma;
};

test("TripExecutionService - resolveTripPlan returns direct plan if found", async () => {
  const prisma = createMockPrisma();
  prisma.db.tripPlanList.push({ id: 10, userId: 1, title: "Hành trình trực tiếp" });
  
  const service = new TripExecutionService(prisma);
  const result = await service.resolveTripPlan(1, 10);

  assert.equal(result.id, 10);
  assert.equal(result.title, "Hành trình trực tiếp");
  assert.equal(prisma.calls.length, 1);
  assert.equal(prisma.calls[0][0], "tripPlan.findFirst");
});

test("TripExecutionService - resolveTripPlan returns shadow plan if exists", async () => {
  const prisma = createMockPrisma();
  prisma.db.tripPlanList.push({
    id: 20,
    userId: 1,
    title: "Shadow Trip Plan",
    metadata: { legacyTripId: 100 },
  });

  const service = new TripExecutionService(prisma);
  const result = await service.resolveTripPlan(1, 100); // 100 là legacyTripId

  assert.equal(result.id, 20);
  assert.equal(result.title, "Shadow Trip Plan");
  assert.ok(prisma.calls.some((c) => c[0] === "tripPlan.findFirst"));
});

test("TripExecutionService - resolveTripPlan clones legacy trip if no plan found", async () => {
  const prisma = createMockPrisma();
  prisma.db.tripList.push({
    id: 100,
    userId: 1,
    title: "Chuyến đi cũ",
    description: "Mô tả",
    thumbnail: "cover.jpg",
    totalDays: 2,
    status: "active",
    isAiGenerated: true,
    estimatedCost: 500000,
    destinations: [
      { id: 9, placeId: 5, dayNumber: 1, order: 1, note: "Chặng 1", transportToNext: "Xe máy", startTime: "08:00", endTime: "10:00" }
    ]
  });

  const service = new TripExecutionService(prisma);
  const result = await service.resolveTripPlan(1, 100);

  assert.ok(result);
  assert.equal(result.title, "Chuyến đi cũ");
  assert.equal(result.totalDays, 2);
  assert.equal(result.source, "ai_generated");
  assert.equal(result.metadata.legacyTripId, 100);

  // Check shadow stops created
  assert.equal(prisma.db.tripStopList.length, 1);
  assert.equal(prisma.db.tripStopList[0].placeId, 5);
  assert.equal(prisma.db.tripStopList[0].metadata.legacyDestinationId, 9);
});

test("TripExecutionService - upsertSession creates new session if not existing", async () => {
  const prisma = createMockPrisma();
  prisma.db.tripPlanList.push({ id: 10, userId: 1, title: "Hành trình" });

  const service = new TripExecutionService(prisma);
  const session = await service.upsertSession(1, 10, {
    deviceId: "device-123",
    status: "active",
    lastKnownLat: 10.02,
    lastKnownLng: 105.78,
  });

  assert.ok(session);
  assert.equal(session.deviceId, "device-123");
  assert.equal(session.tripId, 10);
  assert.equal(session.status, "active");
  assert.equal(session.lastKnownLat, 10.02);
});

test("TripExecutionService - endSession sets status to completed", async () => {
  const prisma = createMockPrisma();
  prisma.db.tripPlanList.push({ id: 10, userId: 1, title: "Hành trình" });
  prisma.db.tripExecutionSessionList.push({
    id: 1,
    tripId: 10,
    userId: 1,
    status: "active",
  });

  const service = new TripExecutionService(prisma);
  const session = await service.endSession(1, 10, "completed");

  assert.ok(session);
  assert.equal(session.status, "completed");
  assert.ok(session.endedAt instanceof Date);
});
