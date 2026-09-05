import { describe, expect, it } from "vitest";

import {
  normalizePaymentBookingId,
  resolvePaymentResultStatus,
} from "../../../../src/modules/booking/utils/paymentResult";

describe("payment result trust boundary", () => {
  it("shows success only for a paid status returned by the authenticated API", () => {
    expect(resolvePaymentResultStatus("paid")).toBe("success");
    expect(resolvePaymentResultStatus("failed")).toBe("failed");
    expect(resolvePaymentResultStatus("fully_refunded")).toBe("failed");
    expect(resolvePaymentResultStatus("pending")).toBe("pending_verify");
    expect(resolvePaymentResultStatus(undefined)).toBe("pending_verify");
  });

  it("accepts only a positive integer booking id from a deep link", () => {
    expect(normalizePaymentBookingId("42")).toBe(42);
    expect(normalizePaymentBookingId(["42", "43"])).toBeNull();
    expect(normalizePaymentBookingId("0")).toBeNull();
    expect(normalizePaymentBookingId("1/../../admin")).toBeNull();
  });
});
