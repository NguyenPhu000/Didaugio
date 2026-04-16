import rateLimit from "express-rate-limit";

const authMaxRequests = process.env.AUTH_RATE_LIMIT_MAX
  ? Number(process.env.AUTH_RATE_LIMIT_MAX)
  : process.env.NODE_ENV !== "production"
    ? 1000
    : 10;

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number.isFinite(authMaxRequests) ? authMaxRequests : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: "Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau 15 phút",
    errorCode: "RATE_LIMIT_EXCEEDED",
  },
});

const refreshMaxRequests = process.env.REFRESH_RATE_LIMIT_MAX
  ? Number(process.env.REFRESH_RATE_LIMIT_MAX)
  : process.env.NODE_ENV !== "production"
    ? 120
    : 30;

export const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number.isFinite(refreshMaxRequests) ? refreshMaxRequests : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: "Quá nhiều yêu cầu làm mới phiên, vui lòng thử lại sau",
    errorCode: "RATE_LIMIT_EXCEEDED",
  },
});

const recoveryMaxRequests = process.env.RECOVERY_RATE_LIMIT_MAX
  ? Number(process.env.RECOVERY_RATE_LIMIT_MAX)
  : process.env.NODE_ENV !== "production"
    ? 120
    : 10;

export const recoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number.isFinite(recoveryMaxRequests) ? recoveryMaxRequests : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: "Quá nhiều yêu cầu khôi phục tài khoản, vui lòng thử lại sau",
    errorCode: "RATE_LIMIT_EXCEEDED",
  },
});

const apiMaxRequests = process.env.NODE_ENV !== "production" ? 5000 : 100;

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: apiMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: "Quá nhiều yêu cầu, vui lòng thử lại sau",
    errorCode: "RATE_LIMIT_EXCEEDED",
  },
});

export const businessApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: "Quá nhiều yêu cầu, vui lòng thử lại sau",
    errorCode: "RATE_LIMIT_EXCEEDED",
  },
});

const routingMaxRequests = process.env.NODE_ENV !== "production" ? 1200 : 180;

export const routingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: routingMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: "Quá nhiều yêu cầu định tuyến, vui lòng thử lại sau",
    errorCode: "RATE_LIMIT_EXCEEDED",
  },
});

const aiNavigateMaxRequests = process.env.NODE_ENV !== "production" ? 240 : 60;

export const aiNavigateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: aiNavigateMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: "Quá nhiều yêu cầu AI điều hướng, vui lòng thử lại sau",
    errorCode: "RATE_LIMIT_EXCEEDED",
  },
});

const navigationMaxRequests = process.env.NODE_ENV !== "production" ? 360 : 90;

export const navigationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: navigationMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: "Quá nhiều yêu cầu navigation, vui lòng thử lại sau",
    errorCode: "RATE_LIMIT_EXCEEDED",
  },
});

const navigationTelemetryMaxRequests =
  process.env.NODE_ENV !== "production" ? 1200 : 240;

export const navigationTelemetryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: navigationTelemetryMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: "Quá nhiều yêu cầu telemetry điều hướng, vui lòng thử lại sau",
    errorCode: "RATE_LIMIT_EXCEEDED",
  },
});
