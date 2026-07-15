import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { getRedisClient } from "../config/redisClient.js";

const isProduction = process.env.NODE_ENV === "production";
const redisClient = getRedisClient();

export const buildRateLimitStoreOptions = (client, namespace) => ({
  prefix: `rl:${namespace}:`,
  sendCommand: (...args) => client.sendCommand(args),
});

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
 */
const createLimiter = ({
  envKey,
  devDefault,
  prodDefault,
  namespace = envKey?.toLowerCase() || "api",
  windowMs = 60 * 1000,
  message,
}) => {
  const envValue = envKey ? process.env[envKey] : undefined;
  const maxFromEnv = envValue ? Number(envValue) : undefined;
  const fallback = isProduction ? prodDefault : devDefault;
  const max = Number.isFinite(maxFromEnv) ? maxFromEnv : fallback;

  const store = redisClient
    ? new RedisStore(buildRateLimitStoreOptions(redisClient, namespace))
    : undefined;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    message: {
      success: false,
      data: null,
      message,
      errorCode: "RATE_LIMIT_EXCEEDED",
    },
  });
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

export const aiNavigateLimiter = createLimiter({
  namespace: "ai-navigate",
  devDefault: 240,
  prodDefault: 60,
  message: "Qua nhieu yeu cau AI dieu huong, vui long thu lai sau",
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

export const groqChatLimiter = createLimiter({
  envKey: "GROQ_CHAT_RATE_LIMIT_MAX",
  devDefault: 300,
  prodDefault: 60,
  message: "Qua nhieu yeu cau tro ly AI, vui long thu lai sau",
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
