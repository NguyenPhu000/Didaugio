import crypto from "node:crypto";
import { appConfig } from "../../config/app.config.js";

const VNPAY_URL = process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE || "";
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET || "";
const VNPAY_RETURN_URL = appConfig.vnpayReturnUrl;

/**
 * Sort object keys alphabetically (A-Z) and build a query-string-like key=value& string.
 * Used for both URL param generation and HMAC signature creation.
 */
function sortAndBuildData(params) {
  const sortedKeys = Object.keys(params).sort((a, b) => a.localeCompare(b));
  const parts = [];
  for (const key of sortedKeys) {
    const value = params[key];
    if (value !== null && value !== undefined && value !== "") {
      parts.push(`${key}=${value}`);
    }
  }
  return parts.join("&");
}

/**
 * Create a VNPay payment URL for the user to redirect to.
 * Amount is in VND and is multiplied by 100 for VNPay's requirement.
 *
 * @param {Object} opts
 * @param {number} opts.amount      - Amount in VND (e.g., 50000)
 * @param {string} opts.transactionRef - Unique reference (e.g., DDG_BKG_102_1)
 * @param {string} opts.orderInfo   - Order description shown to user
 * @param {string} opts.ipAddress   - Client IP address
 * @param {string} [opts.bankCode]  - Optional bank code
 * @returns {string} Payment URL
 */
export function createPaymentUrl({ amount, transactionRef, orderInfo, ipAddress, bankCode, returnUrl }) {
  if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET || VNPAY_TMN_CODE === "your_tmn_code") {
    throw new Error(
      "VNPay chưa được cấu hình. Vui lòng cập nhật VNPAY_TMN_CODE và VNPAY_HASH_SECRET trong .env",
    );
  }

  const vnp_Amount = String(amount * 100);
  const vnp_Command = "pay";
  const vnp_CurrCode = "VND";
  const vnp_Locale = "vn";
  const vnp_OrderType = "other";
  const vnp_TxnRef = transactionRef;
  const vnp_CreateDate = new Date()
    .toISOString()
    .replace(/[-:T]/g, "")
    .replace(/\.\d{3}Z$/, "");
  const vnp_ExpireDate = new Date(Date.now() + 15 * 60 * 1000)
    .toISOString()
    .replace(/[-:T]/g, "")
    .replace(/\.\d{3}Z$/, "");

  const params = {
    vnp_Amount,
    vnp_Command,
    vnp_CurrCode,
    vnp_Locale,
    vnp_OrderType,
    vnp_TxnRef,
    vnp_CreateDate,
    vnp_ExpireDate,
    vnp_IpAddr: ipAddress || "127.0.0.1",
    vnp_ReturnUrl: returnUrl || VNPAY_RETURN_URL,
    vnp_Version: "2.1.0",
  };

  if (bankCode) {
    params.vnp_BankCode = bankCode;
  }

  const signData = sortAndBuildData(params);
  const vnp_SecureHash = crypto
    .createHmac("sha512", VNPAY_HASH_SECRET)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    queryParams.append(key, value);
  }
  queryParams.append("vnp_SecureHash", vnp_SecureHash);
  queryParams.append("vnp_SecureHashType", "SHA512");

  return `${VNPAY_URL}?${queryParams.toString()}`;
}

/**
 * Verify the return query parameters from VNPay (browser redirect).
 * Returns { valid, data } where data contains the parsed response fields.
 *
 * @param {Object} query - Express req.query object
 * @returns {{ valid: boolean, data: Object, error: string|null }}
 */
export function verifyReturn(query) {
  const {
    vnp_Amount,
    vnp_BankCode,
    vnp_BankTranNo,
    vnp_CardType,
    vnp_CurrCode,
    vnp_OrderInfo,
    vnp_PayDate,
    vnp_ResponseCode,
    vnp_TmnCode,
    vnp_TransactionNo,
    vnp_TxnRef,
    vnp_SecureHash,
  } = query;

  if (!vnp_SecureHash) {
    return { valid: false, data: null, error: "Missing secure hash" };
  }

  const secureHashType = query.vnp_SecureHashType || "SHA512";
  const paramsToSign = { ...query };
  delete paramsToSign.vnp_SecureHash;
  delete paramsToSign.vnp_SecureHashType;

  const signData = sortAndBuildData(paramsToSign);
  const computedHash = crypto
    .createHmac("sha512", VNPAY_HASH_SECRET)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  if (computedHash !== vnp_SecureHash) {
    return { valid: false, data: null, error: "Invalid signature" };
  }

  return {
    valid: true,
    data: {
      transactionRef: vnp_TxnRef,
      responseCode: vnp_ResponseCode,
      // Preserve these signed values verbatim. Payment callback processing
      // validates the exact amount/currency obligation after locking the payment.
      amount: vnp_Amount || null,
      currency: vnp_CurrCode || null,
      bankCode: vnp_BankCode || null,
      bankTranNo: vnp_BankTranNo || null,
      cardType: vnp_CardType || null,
      transactionNo: vnp_TransactionNo || null,
      payDate: vnp_PayDate || null,
      orderInfo: vnp_OrderInfo || null,
      tmnCode: vnp_TmnCode || null,
    },
    error: null,
  };
}

/**
 * Verify the IPN (server-to-server) response parameters from VNPay.
 * Same as verifyReturn but tailored for IPN processing.
 *
 * @param {Object} query - Express req.query object
 * @returns {{ valid: boolean, data: Object, error: string|null }}
 */
export function verifyIpn(query) {
  return verifyReturn(query);
}

/**
 * Build the IPN response object (what we send back to VNPay server).
 *
 * @param {string} rspCode - VNPay response code
 * @param {string} message - Human-readable message
 * @returns {Object} IPN response
 */
export function buildIpnResponse(rspCode, message) {
  return { RspCode: rspCode, Message: message };
}
