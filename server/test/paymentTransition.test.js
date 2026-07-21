import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { Client } from "pg";
import "dotenv/config";
import { createPaymentTransition } from "../src/services/payment/paymentTransition.service.js";
import {
  buildAdminDatabaseUrl,
  buildAuditDatabaseName,
  buildDatabaseUrl,
  buildPgClientConfig,
  dropOwnedAuditDatabase,
  quoteIdentifier,
} from "../src/scripts/lib/migrationAudit.js";

const sourceUrl = process.env.DATABASE_URL;
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(serverRoot, "prisma", "schema.prisma");

function deployMigrations(databaseUrl) {
  const prismaCli = path.join(serverRoot, "node_modules", "prisma", "build", "index.js");
  const result = spawnSync(process.execPath, [prismaCli, "migrate", "deploy", `--schema=${schemaPath}`], {
    cwd: serverRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8",
    timeout: 120_000,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Disposable payment transition database migration failed: ${result.error?.message || result.stderr || result.stdout}`);
  }
}

async function withOwnedAuditDatabase(label, run) {
  assert.ok(sourceUrl, "DATABASE_URL is required for payment transition integration tests");
  const databaseName = buildAuditDatabaseName(label);
  const databaseUrl = buildDatabaseUrl(sourceUrl, databaseName);
  const admin = new Client(buildPgClientConfig(buildAdminDatabaseUrl(sourceUrl)));
  let ownsDatabase = false;
  try {
    await admin.connect();
    await admin.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    ownsDatabase = true;
    deployMigrations(databaseUrl);
    return await run(databaseUrl);
  } finally {
    if (ownsDatabase) await dropOwnedAuditDatabase(admin, databaseName);
    await admin.end();
  }
}

async function seedLivePaymentFixture(prisma) {
  const nonce = crypto.randomBytes(6).toString("hex");
  const role = await prisma.role.create({
    data: { name: `payment_transition_${nonce}`, displayName: "Payment transition", isSystem: true },
  });
  const user = await prisma.user.create({
    data: {
      email: `payment-transition-${nonce}@example.test`,
      username: `payment_transition_${nonce}`,
      password: "integration-only",
      roleId: role.id,
    },
  });
  const business = await prisma.business.create({
    data: { ownerId: user.id, businessName: `Payment ${nonce}`, businessType: "hospitality", status: "approved" },
  });
  const category = await prisma.category.create({
    data: { name: `Payment ${nonce}`, slug: `payment-transition-${nonce}` },
  });
  const place = await prisma.place.create({
    data: {
      categoryId: category.id,
      businessId: business.id,
      createdBy: user.id,
      name: `Payment place ${nonce}`,
      slug: `payment-place-${nonce}`,
      address: "Can Tho",
      latitude: 10.03,
      longitude: 105.78,
      status: "approved",
    },
  });
  const service = await prisma.businessService.create({
    data: { businessId: business.id, placeId: place.id, name: "Payment service", serviceType: "experience", price: 100_000 },
  });
  const booking = await prisma.booking.create({
    data: {
      bookingCode: `PAY-${nonce}`,
      userId: user.id,
      serviceId: service.id,
      businessId: business.id,
      useDate: new Date("2027-01-01T00:00:00.000Z"),
      guestName: "Payment guest",
      guestPhone: "0900000000",
      originalPrice: 100_000,
      finalPrice: 100_000,
    },
  });
  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      userId: user.id,
      amount: booking.finalPrice,
      currency: "VND",
      paymentMethod: "manual",
      transactionRef: `PAYMENT-${nonce}`,
      idempotencyKey: `payment-${nonce}`,
    },
  });
  return { payment, booking, user };
}

function createHarness({ obligation = 100_000 } = {}) {
  const payment = {
    id: 1,
    status: "unpaid",
    amount: obligation,
    currency: "VND",
    transaction_ref: "PAY-1",
    booking_id: 2,
    paid_at: null,
  };
  const receipts = [];
  const calls = { paymentUpdate: [], bookingUpdate: [], ledger: 0, actionLog: 0 };
  const tx = {
    $queryRaw: async () => [{ ...payment }],
    paymentReceipt: {
      findUnique: async ({ where: { idempotencyKey } }) =>
        receipts.find((receipt) => receipt.idempotencyKey === idempotencyKey) || null,
      findFirst: async ({ where: { gateway, externalTransactionId } }) =>
        receipts.find(
          (receipt) =>
            receipt.gateway === gateway &&
            receipt.externalTransactionId === externalTransactionId,
        ) || null,
      aggregate: async () => ({
        _sum: { amount: receipts.filter((receipt) => receipt.status === "succeeded").reduce((sum, receipt) => sum + receipt.amount, 0) },
      }),
      create: async ({ data }) => {
        const receipt = { id: receipts.length + 1, ...data };
        receipts.push(receipt);
        return receipt;
      },
    },
    payment: {
      update: async ({ data }) => {
        calls.paymentUpdate.push(data);
        Object.assign(payment, data);
        return { ...payment };
      },
    },
    booking: {
      update: async ({ data }) => {
        calls.bookingUpdate.push(data);
        return {
          id: 2,
          businessId: 3,
          finalPrice: obligation,
          service: { business: { commissionRate: 10 } },
        };
      },
    },
    bookingActionLog: {
      create: async () => {
        calls.actionLog += 1;
      },
    },
  };
  const transition = createPaymentTransition({
    processPaymentLedger: async () => {
      calls.ledger += 1;
    },
  });
  return { tx, payment, receipts, calls, transition };
}

function manualCommand(overrides = {}) {
  return {
    paymentId: 1,
    amount: 40_000,
    currency: "VND",
    source: "manual",
    method: "cash",
    idempotencyKey: "manual-receipt-1",
    externalTransactionId: "cash-book-1",
    actorUserId: 9,
    reason: "Collected at reception",
    ...overrides,
  };
}

test("partial manual receipt preserves the immutable obligation and leaves booking and ledger unpaid", async () => {
  const { tx, payment, receipts, calls, transition } = createHarness();

  const result = await transition.recordSucceededReceipt(tx, manualCommand());

  assert.equal(result.status, "partially_paid");
  assert.equal(result.collectedAmount, 40_000);
  assert.equal(result.outstandingAmount, 60_000);
  assert.equal(receipts.length, 1);
  assert.equal(payment.amount, 100_000);
  assert.deepEqual(calls.bookingUpdate, [{ paymentStatus: "partially_paid" }]);
  assert.equal(calls.ledger, 0);
  assert.equal(calls.actionLog, 0);
});

test("an exact cumulative receipt moves payment and booking once and replays without a second ledger effect", async () => {
  const { tx, payment, calls, transition } = createHarness();

  await transition.recordSucceededReceipt(tx, manualCommand());
  const settled = await transition.recordSucceededReceipt(
    tx,
    manualCommand({ amount: 60_000, idempotencyKey: "manual-receipt-2", externalTransactionId: "cash-book-2" }),
  );
  const replay = await transition.recordSucceededReceipt(
    tx,
    manualCommand({ amount: 60_000, idempotencyKey: "manual-receipt-2", externalTransactionId: "cash-book-2" }),
  );

  assert.equal(settled.status, "paid");
  assert.equal(settled.transitioned, true);
  assert.equal(replay.status, "paid");
  assert.equal(replay.replayed, true);
  assert.equal(payment.amount, 100_000);
  assert.equal(calls.ledger, 1);
  assert.equal(calls.actionLog, 1);
  assert.equal(calls.bookingUpdate.length, 2);
});

test("over-collection and conflicting idempotency reuse fail closed", async () => {
  const { tx, receipts, calls, transition } = createHarness();

  await transition.recordSucceededReceipt(tx, manualCommand({ amount: 80_000 }));
  await assert.rejects(
    transition.recordSucceededReceipt(
      tx,
      manualCommand({ amount: 30_000, idempotencyKey: "manual-receipt-2", externalTransactionId: "cash-book-2" }),
    ),
    (error) => error.errorCode === "PAYMENT_OVER_COLLECTION",
  );
  await assert.rejects(
    transition.recordSucceededReceipt(tx, manualCommand({ amount: 79_999 })),
    (error) => error.errorCode === "PAYMENT_DUPLICATE_TRANSACTION",
  );

  assert.equal(receipts.length, 1);
  assert.equal(calls.ledger, 0);
});

test("manual receipts require explicit actor, reason, idempotency, and external reference", async () => {
  const { tx, transition } = createHarness();

  for (const command of [
    manualCommand({ actorUserId: null }),
    manualCommand({ reason: "" }),
    manualCommand({ idempotencyKey: "" }),
    manualCommand({ externalTransactionId: "" }),
  ]) {
    await assert.rejects(
      transition.recordSucceededReceipt(tx, command),
      (error) => error.errorCode === "VALIDATION_ERROR",
    );
  }
});

test("live owned database serializes concurrent final receipts into one paid transition", { skip: !sourceUrl }, async () => {
  await withOwnedAuditDatabase("payment_transition", async (databaseUrl) => {
    const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    try {
      const { payment, booking, user } = await seedLivePaymentFixture(prisma);
      const transition = createPaymentTransition();
      await prisma.$transaction((tx) => transition.recordSucceededReceipt(tx, {
        paymentId: payment.id,
        amount: 50_000,
        currency: "VND",
        source: "manual",
        method: "cash",
        idempotencyKey: "live-partial",
        externalTransactionId: "live-partial-ref",
        actorUserId: user.id,
        reason: "Partial collection",
      }));

      const attempts = await Promise.allSettled(["a", "b"].map((suffix) =>
        prisma.$transaction((tx) => transition.recordSucceededReceipt(tx, {
          paymentId: payment.id,
          amount: 50_000,
          currency: "VND",
          source: "manual",
          method: "cash",
          idempotencyKey: `live-final-${suffix}`,
          externalTransactionId: `live-final-ref-${suffix}`,
          actorUserId: user.id,
          reason: "Concurrent final collection",
        })),
      ));

      assert.equal(attempts.filter((attempt) => attempt.status === "fulfilled").length, 1);
      assert.equal(attempts.filter((attempt) => attempt.status === "rejected").length, 1);
      assert.ok(
        ["PAYMENT_OVER_COLLECTION", "PAYMENT_ALREADY_FINAL"].includes(
          attempts.find((attempt) => attempt.status === "rejected").reason.errorCode,
        ),
      );
      assert.equal(await prisma.paymentReceipt.count({ where: { paymentId: payment.id, status: "succeeded" } }), 2);
      assert.equal(await prisma.financialLedger.count({ where: { bookingId: booking.id } }), 2);
      assert.equal((await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })).amount, 100_000);
      assert.equal((await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })).paymentStatus, "paid");
    } finally {
      await prisma.$disconnect();
    }
  });
});
