import test, { after } from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import { BOOKING_STATUS, SERVICE_TYPES } from "../../../config/constants.js";
import eventEmitter, { EVENTS } from "../../../utils/eventEmitter.js";
import { BOOKING_ACTION, appendBookingActionLog } from "../bookingActionLog.service.js";

dotenv.config({ override: true });

const RUN_DB_TESTS =
  process.env.BOOKING_DB_TESTS === "1" ||
  process.env.npm_lifecycle_event === "test:booking-db";
const dbTest = RUN_DB_TESTS ? test : test.skip;

let prisma;

const loadPrisma = async () => {
  if (!prisma) {
    ({ default: prisma } = await import("../../../config/prismaClient.js"));
  }
  return prisma;
};

after(async () => {
  await prisma?.$disconnect();
});

function assertEnumContains(enumName, actualLabels, expectedLabels) {
  for (const label of expectedLabels) {
    assert.ok(
      actualLabels.has(label),
      `${enumName} trong PostgreSQL đang thiếu giá trị '${label}'`,
    );
  }
}

const safeUsername = (prefix, nonce) =>
  `${prefix}_${nonce}`.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 30);

async function createBookingFixture(tx, nonce) {
  const role = await tx.role.findFirst({ select: { id: true } });
  assert.ok(role?.id, "Database cần có ít nhất một role để chạy booking DB test");

  const owner = await tx.user.create({
    data: {
      email: `owner-${nonce}@example.test`,
      username: safeUsername("owner", nonce),
      password: "test-password",
      roleId: role.id,
    },
  });

  const user = await tx.user.create({
    data: {
      email: `user-${nonce}@example.test`,
      username: safeUsername("user", nonce),
      password: "test-password",
      roleId: role.id,
    },
  });

  const category = await tx.category.create({
    data: {
      name: `Test Category ${nonce}`,
      slug: `test-category-${nonce}`,
    },
  });

  const district = await tx.districtCantho.create({
    data: {
      name: `Test District ${nonce}`,
      code: `test-district-${nonce}`,
      latitude: 10.0,
      longitude: 105.0,
    },
  });

  const business = await tx.business.create({
    data: {
      ownerId: owner.id,
      businessName: `Test Business ${nonce}`,
      businessType: "test",
      status: "approved",
    },
  });

  const place = await tx.place.create({
    data: {
      businessId: business.id,
      categoryId: category.id,
      districtId: district.id,
      name: `Test Place ${nonce}`,
      slug: `test-place-${nonce}`,
      address: "Test address",
      latitude: 10.0,
      longitude: 105.0,
      status: "approved",
      createdBy: owner.id,
    },
  });

  const service = await tx.businessService.create({
    data: {
      businessId: business.id,
      placeId: place.id,
      name: `Test Service ${nonce}`,
      serviceType: SERVICE_TYPES.SERVICE,
      price: 100000,
      maxCapacity: 10,
    },
  });

  return { role, owner, user, category, district, business, place, service };
}

async function cleanupBookingFixture(db, fixture) {
  if (!fixture) return;

  await db.bookingActionLog.deleteMany({
    where: { booking: { serviceId: fixture.service.id } },
  });
  await db.booking.deleteMany({ where: { serviceId: fixture.service.id } });
  await db.businessService.deleteMany({ where: { id: fixture.service.id } });
  await db.place.deleteMany({ where: { id: fixture.place.id } });
  await db.business.deleteMany({ where: { id: fixture.business.id } });
  await db.category.deleteMany({ where: { id: fixture.category.id } });
  await db.districtCantho.deleteMany({ where: { id: fixture.district.id } });
  await db.user.deleteMany({
    where: { id: { in: [fixture.owner.id, fixture.user.id] } },
  });
}

const waitForEvent = (eventName, timeoutMs = 1_000) =>
  new Promise((resolve) => {
    const timer = setTimeout(() => {
      eventEmitter.off(eventName, onEvent);
      resolve(null);
    }, timeoutMs);
    const onEvent = (payload) => {
      clearTimeout(timer);
      resolve(payload);
    };
    eventEmitter.once(eventName, onEvent);
  });

dbTest("PostgreSQL Booking enums match application constants", async () => {
  const db = await loadPrisma();

  const rows = await db.$queryRaw`
    SELECT t.typname, e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname IN ('BookingStatus', 'bookingstatus', 'BookingAction', 'bookingaction')
    ORDER BY t.typname, e.enumsortorder
  `;

  const labelsByType = rows.reduce((acc, row) => {
    const key = String(row.typname).toLowerCase();
    acc[key] ??= new Set();
    acc[key].add(row.enumlabel);
    return acc;
  }, {});

  assertEnumContains(
    "BookingStatus",
    labelsByType.bookingstatus ?? new Set(),
    Object.values(BOOKING_STATUS),
  );
  assertEnumContains(
    "BookingAction",
    labelsByType.bookingaction ?? new Set(),
    Object.values(BOOKING_ACTION),
  );
});

dbTest("booking table accepts expired status and auto-expire action log", async () => {
  const db = await loadPrisma();
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const rollback = new Error("ROLLBACK_BOOKING_DB_TEST");

  await assert.rejects(
    db.$transaction(async (tx) => {
      const { user, business, service } = await createBookingFixture(tx, nonce);

      const booking = await tx.booking.create({
        data: {
          bookingCode: `TEST-${nonce}`.slice(0, 60),
          userId: user.id,
          businessId: business.id,
          serviceId: service.id,
          quantity: 1,
          useDate: new Date("2026-01-01T12:00:00.000Z"),
          useTime: "09:00",
          bookingAt: new Date("2026-01-01T09:00:00.000Z"),
          guestName: "Test Guest",
          guestPhone: "0900000000",
          guestEmail: `guest-${nonce}@example.test`,
          originalPrice: 100000,
          finalPrice: 100000,
          status: BOOKING_STATUS.PENDING,
        },
      });

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: { status: BOOKING_STATUS.EXPIRED },
      });

      const log = await appendBookingActionLog(tx, {
        bookingId: booking.id,
        action: BOOKING_ACTION.AUTO_EXPIRE,
        metadata: { test: true },
      });

      assert.equal(updated.status, BOOKING_STATUS.EXPIRED);
      assert.equal(log.action, BOOKING_ACTION.AUTO_EXPIRE);

      throw rollback;
    }),
    rollback,
  );
});

dbTest("critical booking path creates request then business confirms it", async () => {
  const db = await loadPrisma();
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let fixture;

  const previousExpiryGrace = process.env.BOOKING_PENDING_EXPIRY_GRACE_MINUTES;
  process.env.BOOKING_PENDING_EXPIRY_GRACE_MINUTES = "5256000";

  try {
    fixture = await db.$transaction((tx) => createBookingFixture(tx, nonce));
    const { create, confirm } = await import("../booking.service.js");
    const bookingAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const createdEventPromise = waitForEvent(EVENTS.BOOKING.CREATED);
    const booking = await create(
      {
        serviceId: fixture.service.id,
        placeId: fixture.place.id,
        quantity: 2,
        bookingAt: bookingAt.toISOString(),
        guestName: "Critical Path Guest",
        guestPhone: "0900000000",
        guestEmail: `guest-critical-${nonce}@example.test`,
        note: "Critical path integration test",
      },
      fixture.user.id,
    );
    const createdEvent = await createdEventPromise;

    assert.equal(booking.status, BOOKING_STATUS.PENDING);
    assert.equal(createdEvent?.bookingId, booking.id);
    assert.equal(createdEvent?.userId, fixture.user.id);
    assert.equal(createdEvent?.businessOwnerId, fixture.owner.id);

    const confirmedEventPromise = waitForEvent(EVENTS.BOOKING.CONFIRMED);
    const confirmed = await confirm(
      booking.id,
      fixture.owner.id,
      "Confirmed by critical path test",
    );
    const confirmedEvent = await confirmedEventPromise;

    assert.equal(confirmed.status, BOOKING_STATUS.CONFIRMED);
    assert.equal(confirmed.businessNote, "Confirmed by critical path test");
    assert.equal(confirmedEvent?.bookingId, booking.id);
    assert.equal(confirmedEvent?.userId, fixture.user.id);

    const approveLog = await db.bookingActionLog.findFirst({
      where: {
        bookingId: booking.id,
        action: BOOKING_ACTION.APPROVE,
      },
    });
    assert.ok(approveLog, "Business confirm phải ghi BookingActionLog approve");
  } finally {
    if (previousExpiryGrace === undefined) {
      delete process.env.BOOKING_PENDING_EXPIRY_GRACE_MINUTES;
    } else {
      process.env.BOOKING_PENDING_EXPIRY_GRACE_MINUTES = previousExpiryGrace;
    }
    await cleanupBookingFixture(db, fixture);
  }
});
