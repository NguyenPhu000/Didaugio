import test from "node:test";
import assert from "node:assert/strict";
import {
  BCRYPT_SALT_ROUNDS,
  BOOKING_TRIP_LINK_STATUS,
  DOMAIN_JOB_STATUS,
  DOMAIN_JOB_TYPES,
  PAYMENT_METHODS,
  TRIP_STOP_FULFILLMENT_STATUS,
} from "../constants.js";

test("server domain constants expose normalized values used across services", () => {
  assert.equal(BCRYPT_SALT_ROUNDS, 13);
  assert.equal(PAYMENT_METHODS.SEPAY_QR, "sepay_qr");
  assert.equal(PAYMENT_METHODS.VNPAY, "VNPAY");
  assert.equal(PAYMENT_METHODS.MOMO, "MOMO");
  assert.equal(PAYMENT_METHODS.SEPAY, "SEPAY");
  assert.equal(TRIP_STOP_FULFILLMENT_STATUS.SCHEDULED, "scheduled");
  assert.equal(BOOKING_TRIP_LINK_STATUS.LINKED, "linked");
  assert.equal(DOMAIN_JOB_STATUS.PENDING, "pending");
  assert.equal(DOMAIN_JOB_TYPES.REBUILD_ROUTE_METRICS, "RebuildRouteMetrics");
}
);
