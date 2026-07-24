import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { isIP } from "node:net";
import { getRedisClient } from "../config/redisClient.js";

const isProduction = process.env.NODE_ENV === "production";
export const buildRateLimitStoreOptions = (client, namespace) => ({
  prefix: `rl:${namespace}:`,
  sendCommand: (...args) => client.sendCommand(args),
});

const normalizeUserId = (value) => {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value > 0 ? String(value) : null;
  }

  if (typeof value !== "string") return null;

  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= 128 ? normalized : null;
};

const normalizeIp = (value) => {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  const ipv4MappedAddress = normalized.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  const candidate = ipv4MappedAddress ? ipv4MappedAddress[1] : normalized;

  return isIP(candidate) ? candidate : null;
};

/**
 * Prefer an authenticated account identity. IP is only the fallback for
 * callers that deliberately run without authentication.
 */
export const buildAiRateLimitKey = (req = {}) => {
  const user = req?.user;
  if (user && typeof user === "object" && !Array.isArray(user)) {
    for (const candidate of [user.userId, user.id]) {
      const userId = normalizeUserId(candidate);
      if (userId) return `user:${userId}`;
    }
  }

  const ip = normalizeIp(req?.ip) || normalizeIp(req?.socket?.remoteAddress);
  return `ip:${ip || "unknown"}`;
};

/**
 * Factory function to create rate limiters with standardized config.
 * Eliminates DRY violation — all limiters share the same structure.
 *
 * @param {Object} options
 * @param {string} options.envKey - Environment variable key for max requests
 * @param {number} options.devDefault - Default max requests in development
 * @param {number} options.prodDefault - Default max requests in production
 * @param {number} [options.windowMs=60000] - Time window in milliseconds
 * @param {string} options.message - User-facing rate limit message
 * @param {(req: import("express").Request) => string} [options.keyGenerator]
 */
const createLimiter = ({
  envKey,
  devDefault,
  prodDefault,
  namespace = envKey?.toLowerCase() || "api",
  windowMs = 60 * 1000,
  message,
  keyGenerator,
}) => {
  const envValue = envKey ? process.env[envKey] : undefined;
  const maxFromEnv = envValue ? Number(envValue) : undefined;
  const fallback = isProduction ? prodDefault : devDefault;
  const max = Number.isSafeInteger(maxFromEnv) && maxFromEnv > 0
    ? maxFromEnv
    : fallback;

  let limiter;
  return (req, res, next) => {
    if (!limiter) {
      const redisClient = getRedisClient();
      const store = redisClient
        ? new RedisStore(buildRateLimitStoreOptions(redisClient, namespace))
        : undefined;

      limiter = rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        store,
        ...(keyGenerator ? { keyGenerator } : {}),
        message: {
          success: false,
          data: null,
          message,
          errorCode: "RATE_LIMIT_EXCEEDED",
        },
      });
    }

    return limiter(req, res, next);
  };
};

export const authLimiter = createLimiter({
  envKey: "AUTH_RATE_LIMIT_MAX",
  devDefault: 1000,
  prodDefault: 10,
  windowMs: 15 * 60 * 1000,
  message: "Qua nhieu yeu cau dang nhap, vui long thu lai sau 15 phut",
});

export const refreshLimiter = createLimiter({
  envKey: "REFRESH_RATE_LIMIT_MAX",
  devDefault: 120,
  prodDefault: 30,
  windowMs: 15 * 60 * 1000,
  message: "Qua nhieu yeu cau lam moi phien, vui long thu lai sau 15 phut",
});

export const recoveryLimiter = createLimiter({
  envKey: "RECOVERY_RATE_LIMIT_MAX",
  devDefault: 120,
  prodDefault: 10,
  windowMs: 15 * 60 * 1000,
  message: "Qua nhieu yeu cau khoi phuc tai khoan, vui long thu lai sau",
});

export const apiLimiter = createLimiter({
  namespace: "api",
  devDefault: 5000,
  prodDefault: 100,
  message: "Qua nhieu yeu cau, vui long thu lai sau",
});

export const businessApiLimiter = createLimiter({
  namespace: "business",
  devDefault: 200,
  prodDefault: 200,
  message: "Qua nhieu yeu cau, vui long thu lai sau",
});

export const reviewCreateLimiter = createLimiter({
  envKey: "REVIEW_CREATE_RATE_LIMIT_MAX",
  devDefault: 60,
  prodDefault: 10,
  windowMs: 10 * 60 * 1000,
  message: "Qua nhieu yeu cau gui danh gia, vui long thu lai sau",
});

export const routingLimiter = createLimiter({
  namespace: "routing",
  devDefault: 1200,
  prodDefault: 180,
  message: "Qua nhieu yeu cau dinh tuyen, vui long thu lai sau",
});

export const navigationLimiter = createLimiter({
  namespace: "navigation",
  devDefault: 360,
  prodDefault: 90,
  message: "Qua nhieu yeu cau navigation, vui long thu lai sau",
});

export const navigationTelemetryLimiter = createLimiter({
  namespace: "navigation-telemetry",
  devDefault: 1200,
  prodDefault: 240,
  message: "Qua nhieu yeu cau telemetry dieu huong, vui long thu lai sau",
});

export const changePasswordLimiter = createLimiter({
  devDefault: 120,
  prodDefault: 5,
  windowMs: 15 * 60 * 1000,
  message: "Qua nhieu yeu cau doi mat khau, vui long thu lai sau 15 phut",
});

export const aiUserLimiter = createLimiter({
  envKey: "GROQ_CHAT_RATE_LIMIT_MAX",
  namespace: "ai-user",
  devDefault: 300,
  prodDefault: 60,
  message: "Qua nhieu yeu cau tro ly AI, vui long thu lai sau",
  keyGenerator: buildAiRateLimitKey,
});

export const documentUploadLimiter = createLimiter({
  envKey: "DOCUMENT_UPLOAD_RATE_LIMIT_MAX",
  devDefault: 50,
  prodDefault: 10,
  windowMs: 15 * 60 * 1000,
  message: "Quá nhiều lần tải lên tài liệu, vui lòng thử lại sau 15 phút",
});

export const documentDownloadLimiter = createLimiter({
  envKey: "DOCUMENT_DOWNLOAD_RATE_LIMIT_MAX",
  devDefault: 60,
  prodDefault: 5,
  windowMs: 60 * 1000,
  message: "Quá nhiều lần tải xuống tài liệu, vui lòng thử lại sau",
});
