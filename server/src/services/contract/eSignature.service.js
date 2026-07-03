/**
 * E-Signature Service — Chữ ký điện tử hợp lệ theo Luật Giao dịch điện tử 2005
 *
 * Flow: Canvas signature (base64 PNG) → SHA-256 hash → HMAC → timestamp + IP + user-agent
 * Áp dụng cho hợp đồng nội bộ (không phải giao dịch ngân hàng)
 *
 * Tham chiếu: NĐ 130/2018/NĐ-CP về giao dịch điện tử
 */

import crypto from "crypto";
import logger from "../../config/logger.js";

const SIGNATURE_SECRET = process.env.SIGNATURE_SECRET || (process.env.JWT_SECRET + "_sig");

const PNG_BASE64_HEADER = "iVBORw0KGgo";
const MIN_SIGNATURE_BYTES = 1024;       // 1KB
const MAX_SIGNATURE_BYTES = 512 * 1024; // 500KB

/**
 * Tạo digital signature hash từ dữ liệu ký
 *
 * @param {Object} params
 * @param {string} params.signatureData - Base64 PNG của chữ ký canvas (có hoặc không có data URI prefix)
 * @param {number} params.businessId
 * @param {number} params.userId
 * @param {string} params.ip - IP address của người ký
 * @param {string} params.userAgent - User agent string
 * @param {string} params.signedAt - ISO timestamp
 * @returns {string} SHA-256 HMAC signature hash
 */
export const createSignatureHash = ({
  signatureData,
  businessId,
  userId,
  ip,
  userAgent,
  signedAt,
}) => {
  const signatureFingerprint = crypto
    .createHash("sha256")
    .update(signatureData)
    .digest("hex");

  const payload = JSON.stringify({
    signatureFingerprint,
    businessId,
    userId,
    ip,
    userAgent,
    signedAt,
  });

  return crypto
    .createHmac("sha256", SIGNATURE_SECRET)
    .update(payload)
    .digest("hex");
};

/**
 * Xác thực chữ ký điện tử bằng timing-safe comparison
 *
 * @param {Object} params - Same params as createSignatureHash
 * @param {string} expectedHash - Hash cần verify
 * @returns {boolean}
 */
export const verifySignatureHash = (params, expectedHash) => {
  try {
    const computed = createSignatureHash(params);
    return crypto.timingSafeEqual(
      Buffer.from(computed, "hex"),
      Buffer.from(expectedHash, "hex"),
    );
  } catch {
    return false;
  }
};

/**
 * Trích xuất signer metadata từ Express request
 *
 * @param {import("express").Request} req
 * @returns {{ ip: string, userAgent: string, signedAt: string, timezone: string }}
 */
export const buildSignerMetadata = (req) => ({
  ip: req.ip || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress,
  userAgent: req.headers["user-agent"],
  signedAt: new Date().toISOString(),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
});

/**
 * Validate chữ ký canvas (base64 PNG)
 * Chấp nhận cả raw base64 và data URI (data:image/png;base64,...)
 *
 * @param {string} signatureBase64
 * @returns {boolean}
 */
export const isValidSignatureData = (signatureBase64) => {
  if (!signatureBase64 || typeof signatureBase64 !== "string") return false;

  // Strip data URI prefix nếu có
  const rawBase64 = signatureBase64.replace(/^data:image\/\w+;base64,/, "");

  // Kiểm tra PNG magic bytes (base64: iVBORw0KGgo)
  if (!rawBase64.startsWith(PNG_BASE64_HEADER)) return false;

  // Kiểm tra kích thước hợp lý
  const sizeBytes = Buffer.byteLength(rawBase64, "base64");
  return sizeBytes >= MIN_SIGNATURE_BYTES && sizeBytes <= MAX_SIGNATURE_BYTES;
};
