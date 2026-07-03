import test from "node:test";
import assert from "node:assert/strict";
import { appConfig } from "../app.config.js";

test("appConfig centralizes server fallback URLs", () => {
  assert.equal(appConfig.osrmUrl, "http://localhost:5000");
  assert.equal(appConfig.apiBaseUrl, "http://localhost:8081");
  assert.equal(
    appConfig.vnpayReturnUrl,
    "http://localhost:8081/api/payments/vnpay-return",
  );
});
