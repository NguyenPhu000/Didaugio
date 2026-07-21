import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";
import { Client } from "pg";

import {
  buildAdminDatabaseUrl,
  buildAuditDatabaseName,
  buildDatabaseUrl,
  buildPgClientConfig,
  dropOwnedAuditDatabase,
  quoteIdentifier,
  redactDatabaseUrl,
} from "../src/scripts/lib/migrationAudit.js";

const sourceUrl = process.env.DATABASE_URL;
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(serverRoot, "prisma", "schema.prisma");
const auditLifecycle = [];

function safeDiagnostic(value, databaseUrl) {
  return String(value || "").replaceAll(databaseUrl, redactDatabaseUrl(databaseUrl));
}

function deployMigrations(databaseUrl) {
  const prismaCli = path.join(serverRoot, "node_modules", "prisma", "build", "index.js");
  const result = spawnSync(process.execPath, [prismaCli, "migrate", "deploy", `--schema=${schemaPath}`], {
    cwd: serverRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8",
    timeout: 120_000,
  });
  if (result.error || result.status !== 0) {
    throw new Error(
      `Disposable booking database migration failed: ${safeDiagnostic(
        result.error?.message || result.stderr || result.stdout || `exit ${result.status}`,
        databaseUrl,
      )}`,
    );
  }
}

async function withOwnedAuditDatabase(label, run, { migrate = false } = {}) {
  assert.ok(sourceUrl, "DATABASE_URL is required for booking availability integration tests");
  const databaseName = buildAuditDatabaseName(label);
  const databaseUrl = buildDatabaseUrl(sourceUrl, databaseName);
  assert.notEqual(new URL(databaseUrl).pathname, new URL(sourceUrl).pathname);

  const admin = new Client(buildPgClientConfig(buildAdminDatabaseUrl(sourceUrl)));
  let ownsDatabase = false;
  let runFailure;
  try {
    await admin.connect();
    await admin.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    ownsDatabase = true;
    if (migrate) deployMigrations(databaseUrl);
    return await run({ databaseName, databaseUrl, admin });
  } catch (error) {
    runFailure = error;
    throw error;
  } finally {
    if (ownsDatabase) {
      try {
        await dropOwnedAuditDatabase(admin, databaseName);
        auditLifecycle.push({ databaseName, cleaned: true, failed: Boolean(runFailure) });
      } finally {
        ownsDatabase = false;
      }
    }
    await admin.end().catch(() => undefined);
  }
}

function futureAt(dayOffset, hour, minute = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour - 7, minute));
}

async function seedBase(prisma) {
  const nonce = crypto.randomBytes(8).toString("hex");
  const role = await prisma.role.create({
    data: { id: 5, name: `user_${nonce}`, displayName: "Integration user", isSystem: true },
  });
  const owner = await prisma.user.create({
    data: {
      email: `owner-${nonce}@example.test`,
      username: `owner_${nonce}`,
      password: "integration-only",
      roleId: role.id,
      profile: { create: { fullName: "Integration Owner", phone: "0900000001" } },
    },
  });
  const customer = await prisma.user.create({
    data: {
      email: `customer-${nonce}@example.test`,
      username: `customer_${nonce}`,
      password: "integration-only",
      roleId: role.id,
      profile: { create: { fullName: "Integration Customer", phone: "0900000002" } },
    },
  });
  const business = await prisma.business.create({
    data: {
      ownerId: owner.id,
      businessName: `Booking Integration ${nonce}`,
      businessType: "hospitality",
      status: "approved",
    },
  });
  const plan = await prisma.subscriptionPlan.create({
    data: {
      name: `Booking integration ${nonce}`,
      slug: `booking-integration-${nonce}`,
      priceMonthly: 0,
      maxBookings: 10_000,
      maxPlaces: 100,
      maxServices: 100,
      maxStaff: 100,
      features: [],
    },
  });
  await prisma.subscription.create({
    data: {
      businessId: business.id,
      planId: plan.id,
      status: "active",
      currentPeriodStart: new Date("2026-01-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2030-01-01T00:00:00.000Z"),
    },
  });
  const category = await prisma.category.create({
    data: { name: `Booking integration ${nonce}`, slug: `booking-integration-${nonce}` },
  });

  return { nonce, owner, customer, business, category };
}

async function createServiceFixture(prisma, base, {
  bookingModel = "resource",
  maxCapacity = 20,
  allowOverbooking = false,
  slotDurationMinutes = 30,
  bufferMinutes = 0,
  resourceCount = 2,
  resourceCapacity = 1,
} = {}) {
  const key = crypto.randomBytes(6).toString("hex");
  const place = await prisma.place.create({
    data: {
      categoryId: base.category.id,
      businessId: base.business.id,
      createdBy: base.owner.id,
      name: `Place ${key}`,
      slug: `booking-place-${base.nonce}-${key}`,
      address: "Can Tho",
      latitude: 10.03,
      longitude: 105.78,
      status: "approved",
    },
  });
  const service = await prisma.businessService.create({
    data: {
      businessId: base.business.id,
      placeId: place.id,
      name: `Service ${key}`,
      serviceType: "experience",
      price: 100_000,
      durationMinutes: slotDurationMinutes,
      maxCapacity,
      bookingModel,
      slotDurationMinutes,
      bufferMinutes,
      allowOverbooking,
      isActive: true,
    },
  });
  const resources = [];
  for (let index = 0; index < resourceCount; index += 1) {
    resources.push(await prisma.placeResource.create({
      data: {
        placeId: place.id,
        serviceId: service.id,
        name: `Resource ${key}-${index + 1}`,
        code: `R${index + 1}-${key}`,
        resourceType: "room",
        capacity: resourceCapacity,
        status: "active",
        position: index,
      },
    }));
  }
  return { place, service, resources };
}

function bookingPayload(service, resourceId, at, overrides = {}) {
  return {
    serviceId: service.id,
    resourceId,
    bookingAt: at.toISOString(),
    quantity: 1,
    guestName: "Integration Guest",
    guestPhone: "0900000003",
    ...overrides,
  };
}

function assertErrorCode(expected) {
  return (error) => {
    assert.equal(error?.errorCode, expected, error?.message);
    return true;
  };
}

test("booking availability integration requires an explicit disposable PostgreSQL URL", { skip: Boolean(sourceUrl) }, () => {
  assert.fail("DATABASE_URL is required for booking availability integration tests");
});

test("booking availability keeps real PostgreSQL resource and capacity integrity", { skip: !sourceUrl, timeout: 180_000 }, async () => {
  let originalDatabaseUrl;
  let appPrisma;
  try {
    await assert.rejects(
      withOwnedAuditDatabase("booking_cleanup_failure", async () => {
        throw new Error("intentional fixture failure");
      }),
      /intentional fixture failure/u,
    );

    await withOwnedAuditDatabase("booking_availability", async ({ databaseUrl }) => {
      originalDatabaseUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = databaseUrl;
      const prismaModule = await import("../src/config/prismaClient.js");
      appPrisma = prismaModule.default;
      const { create: createBooking } = await import("../src/services/booking/booking.service.js");
      const { rescheduleBooking } = await import("../src/services/booking/bookingSchedule.service.js");
      const base = await seedBase(appPrisma);

      const invalidFixture = await createServiceFixture(appPrisma, base);
      const at = futureAt(14, 10);
      const wrongService = await appPrisma.businessService.create({
        data: {
          businessId: base.business.id,
          placeId: invalidFixture.place.id,
          name: `Wrong service ${base.nonce}`,
          serviceType: "experience",
          price: 100_000,
          bookingModel: "resource",
          isActive: true,
        },
      });
      const wrongServiceResource = await appPrisma.placeResource.create({
        data: {
          placeId: invalidFixture.place.id,
          serviceId: wrongService.id,
          name: "Wrong service resource",
          resourceType: "room",
          status: "active",
        },
      });
      const foreignPlace = await appPrisma.place.create({
        data: {
          categoryId: base.category.id,
          businessId: base.business.id,
          createdBy: base.owner.id,
          name: `Foreign ${base.nonce}`,
          slug: `booking-foreign-${base.nonce}`,
          address: "Can Tho",
          latitude: 10.04,
          longitude: 105.79,
          status: "approved",
        },
      });
      const foreignResource = await appPrisma.placeResource.create({
        data: {
          placeId: foreignPlace.id,
          serviceId: invalidFixture.service.id,
          name: "Foreign resource",
          resourceType: "room",
          status: "active",
        },
      });
      const inactiveResource = await appPrisma.placeResource.create({
        data: {
          placeId: invalidFixture.place.id,
          serviceId: invalidFixture.service.id,
          name: "Inactive resource",
          resourceType: "room",
          status: "inactive",
        },
      });
      for (const resourceId of [999_999, wrongServiceResource.id, foreignResource.id, inactiveResource.id]) {
        await assert.rejects(
          createBooking(bookingPayload(invalidFixture.service, resourceId, at), base.customer.id),
          assertErrorCode("BOOKING_RESOURCE_INVALID"),
        );
      }

      const separateFixture = await createServiceFixture(appPrisma, base);
      const [separateFirst, separateSecond] = await Promise.all([
        createBooking(bookingPayload(separateFixture.service, separateFixture.resources[0].id, at), base.customer.id),
        createBooking(bookingPayload(separateFixture.service, separateFixture.resources[1].id, at), base.customer.id),
      ]);
      assert.notEqual(separateFirst.id, separateSecond.id);

      const touchingFixture = await createServiceFixture(appPrisma, base, { resourceCount: 1 });
      const touchingStart = futureAt(15, 10);
      const firstTouching = await createBooking(
        bookingPayload(touchingFixture.service, touchingFixture.resources[0].id, touchingStart),
        base.customer.id,
      );
      const secondTouching = await createBooking(
        bookingPayload(touchingFixture.service, touchingFixture.resources[0].id, new Date(touchingStart.getTime() + 30 * 60_000)),
        base.customer.id,
      );
      assert.equal(firstTouching.endTime.getTime(), secondTouching.startTime.getTime());

      const concurrentResourceFixture = await createServiceFixture(appPrisma, base, { resourceCount: 1 });
      const concurrentResourceAt = futureAt(16, 10);
      const resourceRace = await Promise.allSettled([
        createBooking(bookingPayload(concurrentResourceFixture.service, concurrentResourceFixture.resources[0].id, concurrentResourceAt), base.customer.id),
        createBooking(bookingPayload(concurrentResourceFixture.service, concurrentResourceFixture.resources[0].id, concurrentResourceAt), base.customer.id),
      ]);
      assert.equal(resourceRace.filter((entry) => entry.status === "fulfilled").length, 1);
      assert.equal(resourceRace.filter((entry) => entry.status === "rejected").length, 1);
      assertErrorCode("BOOKING_SLOT_CONFLICT")(resourceRace.find((entry) => entry.status === "rejected").reason);

      const ignoredFixture = await createServiceFixture(appPrisma, base, { resourceCount: 2 });
      const ignoredAt = futureAt(17, 10);
      const ignoredStatuses = ["cancelled", "rejected", "expired"];
      for (const [index, status] of ignoredStatuses.entries()) {
        const booking = await createBooking(
          bookingPayload(ignoredFixture.service, ignoredFixture.resources[1].id, new Date(ignoredAt.getTime() + (index + 1) * 60 * 60_000)),
          base.customer.id,
        );
        await appPrisma.booking.update({
          where: { id: booking.id },
          data: { resourceId: ignoredFixture.resources[0].id, startTime: ignoredAt, endTime: new Date(ignoredAt.getTime() + 30 * 60_000), status },
        });
      }
      const deleted = await createBooking(
        bookingPayload(ignoredFixture.service, ignoredFixture.resources[1].id, new Date(ignoredAt.getTime() + 4 * 60 * 60_000)),
        base.customer.id,
      );
      await appPrisma.booking.update({
        where: { id: deleted.id },
        data: { resourceId: ignoredFixture.resources[0].id, startTime: ignoredAt, endTime: new Date(ignoredAt.getTime() + 30 * 60_000), deletedAt: new Date() },
      });
      await createBooking(bookingPayload(ignoredFixture.service, ignoredFixture.resources[0].id, ignoredAt), base.customer.id);

      const capacityFixture = await createServiceFixture(appPrisma, base, {
        bookingModel: "capacity", maxCapacity: 1, resourceCount: 0,
      });
      const capacityAt = futureAt(18, 10);
      const capacityRace = await Promise.allSettled([
        createBooking(bookingPayload(capacityFixture.service, undefined, capacityAt), base.customer.id),
        createBooking(bookingPayload(capacityFixture.service, undefined, capacityAt), base.customer.id),
      ]);
      assert.equal(capacityRace.filter((entry) => entry.status === "fulfilled").length, 1);
      assert.equal(capacityRace.filter((entry) => entry.status === "rejected").length, 1);
      assertErrorCode("BOOKING_CAPACITY_EXCEEDED")(capacityRace.find((entry) => entry.status === "rejected").reason);

      const overbookingFixture = await createServiceFixture(appPrisma, base, {
        bookingModel: "capacity", maxCapacity: 1, allowOverbooking: true, resourceCount: 0,
      });
      const overbookingAt = futureAt(19, 10);
      const overbookingRace = await Promise.allSettled([
        createBooking(bookingPayload(overbookingFixture.service, undefined, overbookingAt), base.customer.id),
        createBooking(bookingPayload(overbookingFixture.service, undefined, overbookingAt), base.customer.id),
      ]);
      assert.equal(overbookingRace.filter((entry) => entry.status === "fulfilled").length, 2);

      const rescheduleFixture = await createServiceFixture(appPrisma, base, { resourceCount: 1 });
      const rescheduleAt = futureAt(20, 10);
      await createBooking(bookingPayload(rescheduleFixture.service, rescheduleFixture.resources[0].id, rescheduleAt), base.customer.id);
      const movable = await createBooking(
        bookingPayload(rescheduleFixture.service, rescheduleFixture.resources[0].id, new Date(rescheduleAt.getTime() + 60 * 60_000)),
        base.customer.id,
      );
      const originalMovable = await appPrisma.booking.findUniqueOrThrow({ where: { id: movable.id } });
      await assert.rejects(
        rescheduleBooking(movable.id, rescheduleAt.toISOString(), base.owner.id),
        assertErrorCode("BOOKING_SLOT_CONFLICT"),
      );
      const afterRejectedReschedule = await appPrisma.booking.findUniqueOrThrow({ where: { id: movable.id } });
      assert.equal(afterRejectedReschedule.bookingAt.getTime(), originalMovable.bookingAt.getTime());
      assert.equal(afterRejectedReschedule.startTime.getTime(), originalMovable.startTime.getTime());
      assert.equal(afterRejectedReschedule.endTime.getTime(), originalMovable.endTime.getTime());
      assert.equal(afterRejectedReschedule.resourceId, originalMovable.resourceId);

      const idempotencyFixture = await createServiceFixture(appPrisma, base, {
        bookingModel: "capacity", maxCapacity: 1, resourceCount: 0,
      });
      const idempotencyAt = futureAt(21, 10);
      const idempotencyKey = `booking-idempotency-${base.nonce}`;
      const idempotencyPayload = bookingPayload(idempotencyFixture.service, undefined, idempotencyAt, { idempotencyKey });
      const replayFirst = await createBooking(idempotencyPayload, base.customer.id);
      const replaySecond = await createBooking(idempotencyPayload, base.customer.id);
      assert.equal(replaySecond.id, replayFirst.id);
      assert.equal(await appPrisma.booking.count({ where: { idempotencyKey } }), 1);
      const consumedCapacity = await appPrisma.booking.aggregate({
        where: { serviceId: idempotencyFixture.service.id, bookingAt: idempotencyAt, status: { in: ["pending", "confirmed"] }, deletedAt: null },
        _sum: { quantity: true },
      });
      assert.equal(consumedCapacity._sum.quantity, 1);
      await appPrisma.$disconnect();
      appPrisma = undefined;
    }, { migrate: true });
  } finally {
    await appPrisma?.$disconnect().catch(() => undefined);
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  }

  assert.equal(auditLifecycle.length, 2);
  assert.ok(auditLifecycle.every((entry) => entry.cleaned));
  assert.ok(auditLifecycle.some((entry) => entry.failed));
});
