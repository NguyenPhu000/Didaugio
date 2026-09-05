import assert from "node:assert/strict";
import test from "node:test";

import {
  momoReturn,
  sepayReturn,
} from "../../src/controllers/payment/payment.controller.js";

const captureRedirect = (handler, query) => {
  let location = null;
  handler(
    { query },
    { redirect: (value) => { location = value; } },
    () => {},
  );
  return location;
};

test("MoMo return cannot claim success before the authenticated status check", () => {
  const location = captureRedirect(momoReturn, {
    clientType: "mobile",
    resultCode: "0",
    bookingId: "42",
    paymentId: "7",
  });

  assert.equal(
    location,
    "didigaugio://payment/result?status=pending_verify&bookingId=42&paymentId=7",
  );
});

test("SePay return ignores claimed status and drops malformed redirect ids", () => {
  const location = captureRedirect(sepayReturn, {
    clientType: "mobile",
    status: "success",
    bookingId: "1&status=success",
    paymentId: "../admin",
  });

  assert.equal(
    location,
    "didigaugio://payment/result?status=pending_verify",
  );
});
