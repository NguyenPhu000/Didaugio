import crypto from "node:crypto";

const SEPAY_WEBHOOK_SECRET = process.env.SEPAY_WEBHOOK_SECRET || process.env.SEPAY_API_KEY || process.env.SEPAY_SECRET_KEY || "";
const PAYMENT_CODE_PREFIX = process.env.PAYMENT_CODE_PREFIX || "DDG";

/**
 * Trích mã thanh toán (transactionRef) từ webhook bank.
 * Ưu tiên tìm mã theo định dạng Subscription (DDGINV... / DDG-INV-...) và Booking (DDG...).
 *
 * @param {string} [rawCode] - field `code` từ SePay
 * @param {string} [content] - nội dung chuyển khoản
 * @returns {string|null}
 */
function extractPaymentCode(rawCode, content) {
  const escapedPrefix = PAYMENT_CODE_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // 1. Kiểm tra pattern Subscription trong content trước
  if (typeof content === "string" && content) {
    const legacySubscriptionPattern = new RegExp(
      `${escapedPrefix}-INV-\\d+-\\d{6}-\\d+`,
      "i",
    );
    const legacySubscriptionMatch = content.match(legacySubscriptionPattern);
    if (legacySubscriptionMatch) {
      return legacySubscriptionMatch[0].toUpperCase();
    }

    const compactSubscriptionPattern = new RegExp(
      `${escapedPrefix}INV\\d+`,
      "i",
    );
    const compactSubscriptionMatch = content.match(compactSubscriptionPattern);
    if (compactSubscriptionMatch) {
      return compactSubscriptionMatch[0].toUpperCase();
    }
  }

  // 2. Nếu rawCode từ SePay có giá trị và khớp tiền tố cấu hình
  if (typeof rawCode === "string" && rawCode.trim()) {
    const trimmed = rawCode.trim().toUpperCase();
    if (trimmed.startsWith(PAYMENT_CODE_PREFIX.toUpperCase())) {
      return trimmed;
    }
  }

  // 3. Regex tìm mã booking chuẩn (DDG...) trong content
  if (typeof content === "string" && content) {
    const pattern = new RegExp(`${escapedPrefix}[A-Za-z0-9_-]+`, "i");
    const match = content.match(pattern);
    if (match) {
      return match[0].toUpperCase();
    }
  }

  // 4. Fallback: Nếu rawCode có giá trị bất kỳ
  if (typeof rawCode === "string" && rawCode.trim()) {
    return rawCode.trim().toUpperCase();
  }

  return null;
}

/**
 * Verify SePay webhook signature using HMAC-SHA256 OR Header API Key authentication.
 * SePay supports:
 * 1. Header: `Authorization: Apikey <API_KEY>` or `Authorization: Bearer <API_KEY>`
 * 2. Header: `X-SePay-Signature` (HMAC-SHA256) and `X-SePay-Timestamp`
 *
 * @param {string} rawBody - Raw request body string (NOT parsed JSON)
 * @param {string} signature - Value of X-SePay-Signature header
 * @param {string} timestamp - Value of X-SePay-Timestamp header
 * @param {Object} [headers] - Request headers object
 * @returns {{ valid: boolean, error: string|null }}
 */
export function verifyWebhookSignature(rawBody, signature, timestamp, headers = {}) {
  const isProduction = process.env.NODE_ENV === "production";
  const secretKey = SEPAY_WEBHOOK_SECRET;

  if (!secretKey) {
    if (isProduction) {
      return {
        valid: false,
        error: "SEPAY_WEBHOOK_SECRET không được cấu hình trong môi trường Production",
      };
    }
    // No secret configured — skip verification only in non-production mode
    return { valid: true, error: null };
  }

  // Cách 1: Xác thực qua Header Authorization (Apikey / Bearer / x-sepay-api-key)
  const authHeader = String(
    headers["authorization"] || headers["Authorization"] || headers["x-sepay-api-key"] || "",
  ).trim();
  if (authHeader) {
    const token = authHeader.replace(/^(?:Apikey|Bearer)\s+/iu, "").trim();
    if (token) {
      const tokenBuf = Buffer.from(token);
      const secretBuf = Buffer.from(secretKey);
      if (tokenBuf.length === secretBuf.length && crypto.timingSafeEqual(tokenBuf, secretBuf)) {
        return { valid: true, error: null };
      }
    }
  }

  // Cách 2: Xác thực qua HMAC-SHA256 Signature
  if (signature && timestamp) {
    // Anti-replay: reject timestamps off by more than 5 minutes
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
      return { valid: false, error: "Timestamp too old or too far in the future" };
    }

    const expected = "sha256=" + crypto
      .createHmac("sha256", secretKey)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);

    if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: true, error: null };
    }

    return { valid: false, error: "Invalid signature" };
  }

  if (!signature && !timestamp && !authHeader) {
    return { valid: false, error: "Missing authentication header (Authorization or X-SePay-Signature)" };
  }

  return { valid: false, error: "Invalid signature" };
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

  const {
    id,
    accountNumber,
    gateway,
    code,
    content,
    transferType,
    transferAmount,
    transactionDate,
    referenceCode,
  } = body;

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
      accountNumber,
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

export function isExpectedSePayBankAccount(accountNumber, expectedAccountNumber) {
  const normalize = (value) => String(value || "").replace(/\D/gu, "");
  const received = normalize(accountNumber);
  const expected = normalize(expectedAccountNumber);

  return Boolean(received && expected && received === expected);
}

/**
 * Parse outgoing SePay bank transaction webhook payload.
 * Used for refunds/payout transfers from our bank account.
 */
export function parseRefundWebhook(body) {
  if (!body || typeof body !== "object") {
    return { valid: false, data: null, error: "Invalid webhook body" };
  }

  const {
    id,
    accountNumber,
    gateway,
    code,
    content,
    transferType,
    transferAmount,
    transactionDate,
    referenceCode,
  } = body;

  if (!id || !transferAmount) {
    return {
      valid: false,
      data: null,
      error: "Missing required fields (id, transferAmount)",
    };
  }

  if (transferType !== "out") {
    return {
      valid: false,
      data: null,
      error: `Ignoring non-outgoing transfer. Type: ${transferType}`,
    };
  }

  const resolvedCode = extractPaymentCode(code, content);
  const payoutSource = [code, content].filter(Boolean).join(" ");
  const payoutMatch = payoutSource.match(/\bPAYOUT[-_\s#]*(\d+)\b/i);
  const payoutId = payoutMatch ? parseInt(payoutMatch[1], 10) : null;
  const refundTransferMatch = payoutSource.match(
    /\bSEPAY-REFUND-\d+-[A-Fa-f0-9]{24}\b/i,
  );
  const refundTransferReference = refundTransferMatch?.[0] || null;

  return {
    valid: true,
    data: {
      sepayTransactionId: id,
      accountNumber,
      code: resolvedCode,
      payoutId: Number.isInteger(payoutId) ? payoutId : null,
      refundTransferReference,
      content,
      gateway,
      transferAmount,
      transactionDate,
      referenceCode,
    },
    error: null,
  };
}
