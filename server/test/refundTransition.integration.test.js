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
import { createRefundTransition } from "../src/services/payment/refundTransition.service.js";
import { createPaymentRefundOrchestrator } from "../src/services/payment/payment.service.js";
import { settleCompletedLedger } from "../src/services/booking/financialCore.service.js";
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
    cwd: serverRoot, env: { ...process.env, DATABASE_URL: databaseUrl }, encoding: "utf8", timeout: 120_000,
  });
  if (result.error || result.status !== 0) throw new Error(`Refund audit migration failed: ${result.error?.message || result.stderr || result.stdout}`);
}

async function withOwnedAuditDatabase(label, run) {
  assert.ok(sourceUrl, "DATABASE_URL is required for refund integration tests");
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

async function seed(prisma) {
  const nonce = crypto.randomBytes(6).toString("hex");
  const role = await prisma.role.create({ data: { name: `refund_${nonce}`, displayName: "Refund integration", isSystem: true } });
  const user = await prisma.user.create({ data: { email: `refund-${nonce}@example.test`, username: `refund_${nonce}`, password: "integration-only", roleId: role.id } });
  const business = await prisma.business.create({ data: { ownerId: user.id, businessName: `Refund ${nonce}`, businessType: "hospitality", status: "approved" } });
  const category = await prisma.category.create({ data: { name: `Refund ${nonce}`, slug: `refund-${nonce}` } });
  const place = await prisma.place.create({ data: { categoryId: category.id, businessId: business.id, createdBy: user.id, name: `Refund place ${nonce}`, slug: `refund-place-${nonce}`, address: "Can Tho", latitude: 10.03, longitude: 105.78, status: "approved" } });
  const service = await prisma.businessService.create({ data: { businessId: business.id, placeId: place.id, name: "Refund service", serviceType: "experience", price: 100_000 } });
  const booking = await prisma.booking.create({ data: { bookingCode: `REF-${nonce}`, userId: user.id, serviceId: service.id, businessId: business.id, useDate: new Date("2027-01-01T00:00:00.000Z"), guestName: "Refund guest", guestPhone: "0900000000", originalPrice: 100_000, finalPrice: 100_000 } });
  const payment = await prisma.payment.create({ data: { bookingId: booking.id, userId: user.id, amount: 100_000, currency: "VND", paymentMethod: "manual", transactionRef: `REFUND-${nonce}`, idempotencyKey: `payment-${nonce}` } });
  const collection = createPaymentTransition();
  await prisma.$transaction((tx) => collection.recordSucceededReceipt(tx, {
    paymentId: payment.id, amount: 100_000, currency: "VND", source: "manual", method: "cash",
    idempotencyKey: `receipt-${nonce}`, externalTransactionId: `cash-${nonce}`, actorUserId: user.id, reason: "Integration collection",
  }));
  return { payment, booking, user, business };
}

for (const run of ["a", "b"]) {
  test(`owned database refund concurrency and replay conserves balances (${run})`, { skip: !sourceUrl }, async () => {
    await withOwnedAuditDatabase(`refund_transition_${run}`, async (databaseUrl) => {
      const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
      try {
        const { payment, booking, user, business } = await seed(prisma);
        const transition = createRefundTransition({ prisma });

        const gatewayFixture = await seed(prisma);
        const gatewayRefunds = createPaymentRefundOrchestrator({ db: prisma });
        const gatewayIntents = await Promise.allSettled([
          gatewayRefunds.initiateSePayBankRefund(gatewayFixture.payment.id, {
            amount: 100_000, reason: "Gateway refund A", idempotencyKey: `sepay-reserve-${run}-a`, actorUserId: gatewayFixture.user.id,
          }),
          gatewayRefunds.initiateSePayBankRefund(gatewayFixture.payment.id, {
            amount: 100_000, reason: "Gateway refund B", idempotencyKey: `sepay-reserve-${run}-b`, actorUserId: gatewayFixture.user.id,
          }),
        ]);
        assert.equal(gatewayIntents.filter((item) => item.status === "fulfilled").length, 1);
        assert.equal(gatewayIntents.filter((item) => item.status === "rejected").length, 1);
        assert.equal(gatewayIntents.find((item) => item.status === "rejected").reason.errorCode, "REFUND_EXCEEDS_COLLECTED");
        const gatewayAttempts = await prisma.refundAttempt.findMany({ where: { paymentId: gatewayFixture.payment.id } });
        assert.equal(gatewayAttempts.length, 1);
        assert.equal(gatewayAttempts[0].status, "pending");
        assert.equal(gatewayAttempts[0].amount, 100_000);
        await assert.rejects(
          transition.createRefundIntent({
            paymentId: gatewayFixture.payment.id, source: "manual", amount: 1, currency: "VND", idempotencyKey: `manual-after-gateway-${run}`,
            actorUserId: gatewayFixture.user.id, reason: "Manual after gateway reservation",
          }),
          (error) => error.errorCode === "REFUND_EXCEEDS_COLLECTED",
        );
        const manualFixture = await seed(prisma);
        await transition.createRefundIntent({
          paymentId: manualFixture.payment.id, source: "manual", amount: 100_000, currency: "VND", idempotencyKey: `manual-reserve-${run}`,
          actorUserId: manualFixture.user.id, reason: "Manual reservation first",
        });
        await assert.rejects(
          gatewayRefunds.initiateSePayBankRefund(manualFixture.payment.id, {
            amount: 1, reason: "Gateway after manual reservation", idempotencyKey: `gateway-after-manual-${run}`, actorUserId: manualFixture.user.id,
          }),
          (error) => error.errorCode === "REFUND_EXCEEDS_COLLECTED",
        );
        const platformBeforeManualRefund = await prisma.platformWallet.findFirstOrThrow();

        const first = await transition.createRefundIntent({ paymentId: payment.id, source: "manual", amount: 60_000, currency: "VND", idempotencyKey: `refund-${run}-1`, actorUserId: user.id, reason: "Customer cancellation" });
        await assert.rejects(
          transition.createRefundIntent({ paymentId: payment.id, source: "manual", amount: 50_000, currency: "VND", idempotencyKey: `refund-${run}-2`, actorUserId: user.id, reason: "Second concurrent refund" }),
          (error) => error.errorCode === "REFUND_EXCEEDS_COLLECTED",
        );
        const success = await transition.succeedRefundAttempt({ refundAttemptId: first.attempt.id });
        const replay = await transition.succeedRefundAttempt({ refundAttemptId: success.attempt.id });
        assert.equal(replay.replayed, true);
        const refunded = await prisma.refundAttempt.aggregate({ where: { paymentId: payment.id, status: "succeeded" }, _sum: { amount: true } });
        const refundedAmount = refunded._sum.amount;
        assert.ok([50_000, 60_000].includes(refundedAmount));
        const currentPayment = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
        assert.equal(currentPayment.refundAmount, refundedAmount);
        assert.equal(currentPayment.status, "partially_refunded");
        const wallet = await prisma.partnerWallet.findUniqueOrThrow({ where: { businessId: business.id } });
        const platform = await prisma.platformWallet.findFirstOrThrow();
        const commissionDebit = Math.floor((refundedAmount * 10_000) / 100_000);
        assert.equal(wallet.frozenBalance, 90_000 - (refundedAmount - commissionDebit));
        assert.equal(wallet.balance, 0);
        assert.equal(platform.balance, platformBeforeManualRefund.balance - commissionDebit);
        assert.equal(await prisma.financialLedger.count({ where: { bookingId: booking.id, type: "REFUND" } }), 1);

        // A separately settled booking must debit available balance, not frozen balance.
        const settledFixture = await seed(prisma);
        await prisma.$transaction((tx) => settleCompletedLedger(
          tx,
          settledFixture.booking.id,
          settledFixture.business.id,
          90_000,
        ));
        const settledIntent = await transition.createRefundIntent({
          paymentId: settledFixture.payment.id,
          source: "manual",
          amount: 10_000,
          currency: "VND",
          idempotencyKey: `settled-refund-${run}`,
          actorUserId: settledFixture.user.id,
          reason: "Settled booking refund",
        });
        await transition.succeedRefundAttempt({ refundAttemptId: settledIntent.attempt.id });
        const settledWallet = await prisma.partnerWallet.findUniqueOrThrow({ where: { businessId: settledFixture.business.id } });
        assert.equal(settledWallet.frozenBalance, 0);
        assert.equal(settledWallet.balance, 81_000);
      } finally {
        await prisma.$disconnect();
      }
    });
  });
}
