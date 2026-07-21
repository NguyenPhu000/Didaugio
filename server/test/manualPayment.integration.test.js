import assert from "node:assert/strict";
import test from "node:test";
import { markPaidSchema } from "../src/models/schemas/booking/booking.schema.js";

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
