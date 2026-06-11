import crypto from "node:crypto";
import fetch from "node-fetch";

const MOMO_API_URL = process.env.MOMO_API_URL || "https://test-payment.momo.vn/v2/gateway/api";
const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || "";
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || "";
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || "";
const MOMO_REDIRECT_URL = process.env.MOMO_REDIRECT_URL || "http://localhost:8081/api/payments/momo-return";
const MOMO_IPN_URL = process.env.MOMO_IPN_URL || "http://localhost:8081/api/payments/momo-ipn";



/**
 * Create MoMo payment URL (ATM/Web).
 *
 * @param {Object} opts
 * @param {number} opts.amount           - Amount in VND
 * @param {string} opts.transactionRef    - Unique reference (e.g., DDG_BKG_102_1)
 * @param {string} opts.orderInfo         - Order description
 * @param {string} opts.ipAddress        - Client IP
 * @param {string} opts.returnUrl        - Server return URL (not MoMo redirect — we handle redirect logic)
 * @returns {Promise<{ paymentUrl: string, transId: string }>}
 */
export async function createPaymentUrl({ amount, transactionRef, orderInfo, returnUrl }) {
  const requestId = `${transactionRef}_${Date.now()}`;
  const orderId = transactionRef;
  const requestType = "captureWallet";
  const extraData = "";
  const redirectUrl = returnUrl || MOMO_REDIRECT_URL;
  const ipnUrl = MOMO_IPN_URL;

  // MoMo requires EXACT field order in the raw signature string — NOT alphabetical.
  // Spec order: accessKey, amount, extraData, ipnUrl, orderId, orderInfo, partnerCode,
  //             redirectUrl, requestId, requestType
  const rawData = [
    `accessKey=${MOMO_ACCESS_KEY}`,
    `amount=${amount}`,
    `extraData=${extraData}`,
    `ipnUrl=${ipnUrl}`,
    `orderId=${orderId}`,
    `orderInfo=${orderInfo}`,
    `partnerCode=${MOMO_PARTNER_CODE}`,
    `redirectUrl=${redirectUrl}`,
    `requestId=${requestId}`,
    `requestType=${requestType}`,
  ].join("&");

  const signature = crypto
    .createHmac("sha256", MOMO_SECRET_KEY)
    .update(Buffer.from(rawData, "utf-8"))
    .digest("hex");

  const payload = {
    partnerCode: MOMO_PARTNER_CODE,
    accessKey: MOMO_ACCESS_KEY,
    requestId,
    amount: String(amount),
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
  };

  const response = await fetch(`${MOMO_API_URL}/create`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    timeout: 10_000,
  });

  const responseData = await response.json();
  const { payUrl, deeplink, qrCodeUrl, transId } = responseData;

  if (!payUrl && !deeplink && !qrCodeUrl) {
    throw new Error(`MoMo error: ${responseData.message || "Unknown error"}`);
  }

  return {
    paymentUrl: payUrl || deeplink || qrCodeUrl,
    transId: transId || null,
    requestId,
  };
}

/**
 * Verify MoMo IPN callback signature.
 * MoMo sends signature in the `signature` field.
 *
 * @param {Object} body - Parsed JSON body from MoMo IPN
 * @returns {{ valid: boolean, error: string|null }}
 */
export function verifyIpnSignature(body) {
  const {
    partnerCode,
    orderId,
    requestId,
    amount,
    transId,
    resultCode,
    message,
    responseTime,
    signature,
  } = body;

  if (!signature) {
    return { valid: false, error: "Missing MoMo signature" };
  }

  const rawData = [
    `accessKey=${MOMO_ACCESS_KEY}`,
    `amount=${amount}`,
    `extraData=`,
    `message=${message || ""}`,
    `orderId=${orderId}`,
    `orderInfo=${body.orderInfo || ""}`,
    `partnerCode=${partnerCode}`,
    `requestId=${requestId}`,
    `responseTime=${responseTime || ""}`,
    `resultCode=${resultCode}`,
    `transId=${transId}`,
  ]
    .sort((a, b) => a.localeCompare(b))
    .join("&");

  const computedSignature = crypto
    .createHmac("sha256", MOMO_SECRET_KEY)
    .update(Buffer.from(rawData, "utf-8"))
    .digest("hex");

  if (computedSignature !== signature) {
    return { valid: false, error: "Invalid MoMo signature" };
  }

  return { valid: true, error: null };
}

/**
 * Build MoMo IPN response object (what we send back to MoMo).
 *
 * @param {number} resultCode - MoMo result code (0 = success)
 * @param {string} message
 * @returns {{ resultCode: number, message: string }}
 */
export function buildIpnResponse(resultCode, message) {
  return { resultCode, message };
}
