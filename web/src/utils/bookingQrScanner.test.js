import { describe, expect, it } from "vitest";
import { parseBookingQrText } from "./bookingQrScanner";

describe("parseBookingQrText", () => {
  it("parses DIDaugio booking QR JSON payload", () => {
    const result = parseBookingQrText(
      JSON.stringify({
        type: "didaugio.booking",
        version: 1,
        action: "checkin",
        bookingCode: " bk-12345 ",
      }),
    );

    expect(result).toEqual({
      bookingCode: "BK-12345",
      action: "checkin",
      qrPayload: expect.any(String),
    });
  });

  it("parses booking verify URLs", () => {
    const result = parseBookingQrText("https://didaugio.vn/booking/verify/BK-98765?x=1");

    expect(result.bookingCode).toBe("BK-98765");
    expect(result.action).toBe("checkin");
  });

  it("parses raw booking codes", () => {
    const result = parseBookingQrText(" bk-77777 ");

    expect(result.bookingCode).toBe("BK-77777");
    expect(result.action).toBe("checkin");
  });

  it("rejects empty QR text", () => {
    expect(() => parseBookingQrText("   ")).toThrow("EMPTY_QR");
  });
});
