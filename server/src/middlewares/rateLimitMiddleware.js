import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau 15 phút",
    errorCode: "RATE_LIMIT_EXCEEDED",
  },
});

const apiMaxRequests =
  process.env.NODE_ENV !== "production" ? 5000 : 100;

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: apiMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
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
    message: "Quá nhiều yêu cầu, vui lòng thử lại sau",
    errorCode: "RATE_LIMIT_EXCEEDED",
  },
});
