import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { Client } from "pg";
import "dotenv/config";
import { markPaidSchema } from "../src/models/schemas/booking/booking.schema.js";
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

const completeManualPayment = {
  paymentMethod: "cash",
  transactionRef: "manual-bank-slip-1",
  amount: 120_000,
  idempotencyKey: "manual-collection-1",
  reason: "Cash collected at the reception desk",
};

test("manual payment contract requires an explicit collection command", () => {
  assert.equal(markPaidSchema.safeParse(completeManualPayment).success, true);

  for (const missingField of [
    "paymentMethod",
    "transactionRef",
    "amount",
    "idempotencyKey",
    "reason",
  ]) {
    const payload = { ...completeManualPayment };
    delete payload[missingField];
    assert.equal(
      markPaidSchema.safeParse(payload).success,
      false,
      `${missingField} must be required for a manual collection`,
    );
  }
});

function deployMigrations(databaseUrl) {
  const prismaCli = path.join(serverRoot, "node_modules", "prisma", "build", "index.js");
  const result = spawnSync(process.execPath, [prismaCli, "migrate", "deploy", `--schema=${schemaPath}`], {
    cwd: serverRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8",
    timeout: 120_000,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Disposable manual payment database migration failed: ${result.error?.message || result.stderr || result.stdout}`);
  }
}

async function withOwnedAuditDatabase(run) {
  assert.ok(sourceUrl, "DATABASE_URL is required for manual payment integration tests");
  const databaseName = buildAuditDatabaseName("manual_payment");
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

async function seedBooking(prisma) {
  const nonce = crypto.randomBytes(6).toString("hex");
  const role = await prisma.role.create({
    data: { name: `manual_payment_${nonce}`, displayName: "Manual payment", isSystem: true },
  });
  const user = await prisma.user.create({
    data: {
      email: `manual-payment-${nonce}@example.test`,
      username: `manual_payment_${nonce}`,
      password: "integration-only",
      roleId: role.id,
    },
  });
  const business = await prisma.business.create({
    data: { ownerId: user.id, businessName: `Manual ${nonce}`, businessType: "hospitality", status: "approved" },
  });
  const category = await prisma.category.create({
    data: { name: `Manual ${nonce}`, slug: `manual-payment-${nonce}` },
  });
  const place = await prisma.place.create({
    data: {
      categoryId: category.id,
      businessId: business.id,
      createdBy: user.id,
      name: `Manual place ${nonce}`,
      slug: `manual-place-${nonce}`,
      address: "Can Tho",
      latitude: 10.03,
      longitude: 105.78,
      status: "approved",
    },
  });
  const service = await prisma.businessService.create({
    data: { businessId: business.id, placeId: place.id, name: "Manual service", serviceType: "experience", price: 100_000 },
  });
  const booking = await prisma.booking.create({
    data: {
      bookingCode: `MANUAL-${nonce}`,
      userId: user.id,
      serviceId: service.id,
      businessId: business.id,
      useDate: new Date("2027-01-01T00:00:00.000Z"),
      guestName: "Manual guest",
      guestPhone: "0900000000",
      originalPrice: 100_000,
      finalPrice: 100_000,
    },
  });
  return { booking, user };
}

test("markPaid records explicit partial and final manual receipts without overwriting the obligation", { skip: !sourceUrl }, async () => {
  await withOwnedAuditDatabase(async (databaseUrl) => {
    const originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = databaseUrl;
    const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    let appPrisma;
    try {
      const fixture = await seedBooking(prisma);
      const prismaModule = await import("../src/config/prismaClient.js");
      appPrisma = prismaModule.default;
      const { markPaid } = await import(`../src/services/booking/booking.service.js?manual-payment-${Date.now()}`);

      await markPaid(fixture.booking.id, {
        paymentMethod: "cash",
        transactionRef: "manual-partial-ref",
        amount: 40_000,
        idempotencyKey: "manual-partial-key",
        reason: "Cash deposit collected",
      }, fixture.user.id);
      await markPaid(fixture.booking.id, {
        paymentMethod: "cash",
        transactionRef: "manual-final-ref",
        amount: 60_000,
        idempotencyKey: "manual-final-key",
        reason: "Remaining cash collected",
      }, fixture.user.id);
      await markPaid(fixture.booking.id, {
        paymentMethod: "cash",
        transactionRef: "manual-final-ref",
        amount: 60_000,
        idempotencyKey: "manual-final-key",
        reason: "Remaining cash collected",
      }, fixture.user.id);

      const payment = await prisma.payment.findUniqueOrThrow({ where: { bookingId: fixture.booking.id } });
      assert.equal(payment.amount, 100_000);
      assert.equal(payment.status, "paid");
      assert.equal(await prisma.paymentReceipt.count({ where: { paymentId: payment.id } }), 2);
      assert.equal(await prisma.financialLedger.count({ where: { bookingId: fixture.booking.id } }), 2);
    } finally {
      await appPrisma?.$disconnect();
      await prisma.$disconnect();
      if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });
});
