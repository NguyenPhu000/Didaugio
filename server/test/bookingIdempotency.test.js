import assert from "node:assert/strict";
import test from "node:test";

import { isUniqueConstraintOnIdempotencyKey } from "../src/services/booking/bookingIdempotency.service.js";

test("booking idempotency recognizes only the tenant-scoped composite unique target", () => {
  for (const target of [
    ["userId", "idempotencyKey"],
    ["user_id", "idempotency_key"],
    "bookings_user_id_idempotency_key_key",
  ]) {
    assert.equal(
      isUniqueConstraintOnIdempotencyKey({ code: "P2002", meta: { target } }),
      true,
    );
  }
  assert.equal(
    isUniqueConstraintOnIdempotencyKey({ code: "P2002", meta: { target: ["idempotencyKey"] } }),
    false,
  );
  assert.equal(
    isUniqueConstraintOnIdempotencyKey({ code: "P2002", meta: { target: ["userId", "other"] } }),
    false,
  );
});
