import crypto from "node:crypto";
import { cursorValidationErrors } from "../../observability/metrics.js";

const CURSOR_VERSION = 1;

const toBase64Url = (value) => Buffer.from(value).toString("base64url");
const fromBase64Url = (value) => Buffer.from(value, "base64url").toString("utf8");

const sign = (payload, secret) =>
  crypto.createHmac("sha256", secret).update(payload).digest("base64url");

export function encodePlaceCursor({ sortBy, values, id }, secret) {
  const payload = JSON.stringify({ v: CURSOR_VERSION, sortBy, values, id });
  const encodedPayload = toBase64Url(payload);
  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function decodePlaceCursor(cursor, secret) {
  try {
    const [encodedPayload, signature] = String(cursor || "").split(".");
    if (!encodedPayload || !signature) throw new Error("missing cursor parts");

    const expected = sign(encodedPayload, secret);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
      actualBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      throw new Error("signature mismatch");
    }

    const decoded = JSON.parse(fromBase64Url(encodedPayload));
    if (
      decoded?.v !== CURSOR_VERSION ||
      typeof decoded.sortBy !== "string" ||
      !Array.isArray(decoded.values) ||
      !Number.isInteger(decoded.id)
    ) {
      throw new Error("invalid cursor payload");
    }

    return {
      sortBy: decoded.sortBy,
      values: decoded.values,
      id: decoded.id,
    };
  } catch {
    cursorValidationErrors.inc();
    throw new Error("Invalid cursor");
  }
}
