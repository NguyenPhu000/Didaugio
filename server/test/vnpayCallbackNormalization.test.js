import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

process.env.VNPAY_HASH_SECRET = "callback-normalization-test-secret";

const { verifyIpn } = await import(
  "../src/services/payment/vnpay.service.js?callback-normalization-test"
);

test("VNPay verification preserves the signed amount and currency fields for obligation validation", () => {
  const query = {
    vnp_Amount: "12500000",
    vnp_CurrCode: "vnd",
    vnp_TxnRef: "DDG-REF-123",
  };
  const signData = Object.entries(query)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  query.vnp_SecureHash = crypto
    .createHmac("sha512", process.env.VNPAY_HASH_SECRET)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  const result = verifyIpn(query);

  assert.equal(result.valid, true);
  assert.equal(result.data.amount, "12500000");
  assert.equal(result.data.currency, "vnd");
});
