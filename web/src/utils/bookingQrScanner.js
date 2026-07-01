const BOOKING_VERIFY_RE = /\/booking\/verify\/([^/?#]+)/i;

export function parseBookingQrText(rawText) {
  const text = String(rawText || "").trim();
  if (!text) {
    throw new Error("EMPTY_QR");
  }

  let parsed = null;
  if (text.startsWith("{")) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  const urlCode = text.match(BOOKING_VERIFY_RE)?.[1];
  const bookingCode = String(
    parsed?.bookingCode || parsed?.code || (urlCode ? decodeURIComponent(urlCode) : text),
  )
    .trim()
    .toUpperCase();

  if (!bookingCode) {
    throw new Error("INVALID_QR");
  }

  const action = ["verify", "checkin"].includes(String(parsed?.action).toLowerCase())
    ? String(parsed.action).toLowerCase()
    : "checkin";

  return {
    bookingCode,
    action,
    qrPayload: text,
  };
}
