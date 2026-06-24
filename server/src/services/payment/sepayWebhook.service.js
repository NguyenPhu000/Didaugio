import crypto from "node:crypto";

const SEPAY_WEBHOOK_SECRET = process.env.SEPAY_WEBHOOK_SECRET || "";
const PAYMENT_CODE_PREFIX = process.env.PAYMENT_CODE_PREFIX || "DDG";

/**
 * Trích mã thanh toán (transactionRef) từ webhook bank.
 * Ưu tiên field `code` do SePay tự nhận diện. Nếu thiếu, regex tìm mã
 * có tiền tố cấu hình (mặc định DDG) trong nội dung chuyển khoản.
 *
 * @param {string} [rawCode] - field `code` từ SePay
 * @param {string} [content] - nội dung chuyển khoản
 * @returns {string|null}
 */
function extractPaymentCode(rawCode, content) {
  if (typeof rawCode === "string" && rawCode.trim()) {
    return rawCode.trim();
  }

  if (typeof content === "string" && content) {
    const pattern = new RegExp(`${PAYMENT_CODE_PREFIX}[A-Za-z0-9]+`, "i");
    const match = content.match(pattern);
    if (match) {
      return match[0].toUpperCase();
    }
  }

  return null;
}

/**
 * Verify SePay webhook signature using HMAC-SHA256.
 * SePay signs: {timestamp}.{rawBody} and sends signature in X-SePay-Signature header.
 *
 * @param {string} rawBody - Raw request body string (NOT parsed JSON)
 * @param {string} signature - Value of X-SePay-Signature header
 * @param {string} timestamp - Value of X-SePay-Timestamp header
 * @returns {{ valid: boolean, error: string|null }}
 */
export function verifyWebhookSignature(rawBody, signature, timestamp) {
  if (!SEPAY_WEBHOOK_SECRET) {
    // No secret configured — skip verification (dev mode)
    return { valid: true, error: null };
  }

  if (!signature || !timestamp) {
    return { valid: false, error: "Missing signature or timestamp header" };
  }

  // Anti-replay: reject timestamps off by more than 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
    return { valid: false, error: "Timestamp too old or too far in the future" };
  }

  const expected = "sha256=" + crypto
    .createHmac("sha256", SEPAY_WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, error: "Invalid signature" };
  }

  return { valid: true, error: null };
}

/**
 * Parse SePay bank transaction webhook payload.
 * Different from Payment Gateway IPN — this is from SePay Webhooks system.
 *
 * Payload structure:
 * {
 *   id: 92704,                    // SePay transaction ID (dedup key)
 *   gateway: "Vietcombank",
 *   transactionDate: "2024-07-02 11:08:33",
 *   accountNumber: "1017588888",
 *   subAccount: "",
 *   code: "DDG_BKG_123_1",       // Payment code extracted from memo
 *   content: "DDG_BKG_123_1 chuyen tien",
 *   transferType: "in",
 *   transferAmount: 5000000,
 *   accumulated: 105000000,
 *   referenceCode: "FT24012345678"
 * }
 */
export function parseBankWebhook(body) {
  if (!body || typeof body !== "object") {
    return { valid: false, data: null, error: "Invalid webhook body" };
  }

  const { id, gateway, code, content, transferType, transferAmount, transactionDate, referenceCode } = body;

  if (!id || !transferAmount) {
    return { valid: false, data: null, error: "Missing required fields (id, transferAmount)" };
  }

  if (transferType !== "in") {
    return {
      valid: false,
      data: null,
      error: `Ignoring non-incoming transfer. Type: ${transferType}`,
    };
  }

  const resolvedCode = extractPaymentCode(code, content);

  if (!resolvedCode) {
    return {
      valid: false,
      data: null,
      error: "No payment code in transaction — cannot match to booking",
    };
  }

  return {
    valid: true,
    data: {
      sepayTransactionId: id,
      code: resolvedCode,
      content,
      gateway,
      transferAmount,
      transactionDate,
      referenceCode,
    },
    error: null,
  };
}
