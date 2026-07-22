import assert from "node:assert/strict";
import test from "node:test";

import prisma from "../src/config/prismaClient.js";
import { getByBooking } from "../src/controllers/payment/payment.controller.js";
import paymentRouter from "../src/routes/payment/payment.route.js";

function replaceMethod(target, key, replacement) {
  const original = target[key];
  target[key] = replacement;
  return () => { target[key] = original; };
}

function paymentFixture(overrides = {}) {
  return {
    id: 41, bookingId: 17, userId: 9, amount: 125000, currency: "VND",
    paymentMethod: "VNPAY", transactionId: null, transactionRef: "DDG-41",
    bankCode: null, status: "unpaid", paidAt: null, refundAmount: 0,
    refundedAt: null, refundReason: null,
    createdAt: new Date("2026-07-21T00:00:00.000Z"),
    updatedAt: new Date("2026-07-21T00:00:00.000Z"),
    booking: {
      bookingCode: "BOOK-17", status: "pending", finalPrice: 125000,
      service: { name: "Tour", place: { name: "Can Tho" } },
    },
    ...overrides,
  };
}

async function invokeGetByBooking({ bookingId = "17", userId = 9, roleId = 5 }) {
  let response;
  await getByBooking(
    { params: { bookingId }, user: { userId, roleId } },
    {
      status(statusCode) { return { json(body) { response = { statusCode, body }; } }; },
      json(body) { response = { statusCode: 200, body }; },
    },
    (error) => { throw error; },
  );
  return response;
}

test("authenticated by-booking route is registered before the generic payment id route", () => {
  const byBookingIndex = paymentRouter.stack.findIndex((layer) => layer.route?.path === "/by-booking/:bookingId");
  const genericIdIndex = paymentRouter.stack.findIndex((layer) => layer.route?.path === "/:id");
  assert.ok(byBookingIndex >= 0, "GET /by-booking/:bookingId must be registered");
  assert.ok(genericIdIndex >= 0);
  assert.ok(byBookingIndex < genericIdIndex);
  assert.equal(paymentRouter.stack[byBookingIndex].route.methods.get, true);
});

test("by-booking endpoint returns the latest owned payment and stable payment shape", async () => {
  let query;
  const restore = replaceMethod(prisma.payment, "findFirst", async (args) => {
    query = args;
    return paymentFixture();
  });
  try {
    const response = await invokeGetByBooking({ userId: 9 });
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.id, 41);
    assert.equal(response.body.data.booking.status, "pending");
    assert.deepEqual(query.orderBy, { createdAt: "desc" });
    assert.deepEqual(query.where, { bookingId: 17 });
  } finally { restore(); }
});

test("by-booking rejects a non-owner while allowing an admin", async () => {
  const restore = replaceMethod(prisma.payment, "findFirst", async () => paymentFixture());
  try {
    const forbidden = await invokeGetByBooking({ userId: 10, roleId: 5 });
    assert.equal(forbidden.statusCode, 403);
    assert.equal(forbidden.body.success, false);
    assert.equal(forbidden.body.data, null);
    assert.equal(forbidden.body.errorCode, "FORBIDDEN");
    assert.equal((await invokeGetByBooking({ userId: 10, roleId: 2 })).statusCode, 200);
  } finally { restore(); }
});

test("by-booking rejects an invalid booking id before it queries Prisma", async () => {
  let reads = 0;
  const restore = replaceMethod(prisma.payment, "findFirst", async () => { reads += 1; return null; });
  try {
    const invalid = await invokeGetByBooking({ bookingId: "0" });
    assert.equal(invalid.statusCode, 400);
    assert.equal(invalid.body.success, false);
    assert.equal(invalid.body.data, null);
    assert.equal(invalid.body.errorCode, "VALIDATION_ERROR");
    assert.equal(reads, 0);
  } finally { restore(); }
});
