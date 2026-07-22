import { describe, expect, it, vi } from "vitest";
import client from "../../../api/client";
import { getPaymentByBookingApi } from "./paymentApi";

vi.mock("../../../api/client", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

describe("payment booking status API contract", () => {
  it("reads the authenticated by-booking payment endpoint", () => {
    getPaymentByBookingApi(17);

    expect(client.get).toHaveBeenCalledWith("/payments/by-booking/17");
  });
});
