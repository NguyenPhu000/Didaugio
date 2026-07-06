import { createRequire } from "module";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import errorHandler from "./middlewares/errorHandler.js";
import logger from "./config/logger.js";
import prisma from "./config/prismaClient.js";
import { initNotificationService } from "./services/notification/notification.service.js";
import { initSocketIO } from "./config/socketIO.js";
import { validateEnv } from "./config/validateEnv.js";
import { registerApiRoutes, registerRateLimiters } from "./routes/index.js";
import { startPendingBookingExpireScheduler } from "./schedulers/pendingBookingExpire.scheduler.js";
import { startTripAutoCompleteScheduler } from "./schedulers/tripAutoComplete.scheduler.js";
import { startSubscriptionRenewalReminderScheduler } from "./schedulers/subscriptionRenewalReminder.scheduler.js";
import { startSubscriptionGracePeriodScheduler } from "./schedulers/subscriptionGracePeriod.scheduler.js";
import { startSubscriptionPastDueScheduler } from "./schedulers/subscriptionPastDue.scheduler.js";
import { startSubscriptionFeatureLockScheduler } from "./schedulers/subscriptionFeatureLock.scheduler.js";
import { startSubscriptionStatsScheduler } from "./schedulers/subscriptionStats.scheduler.js";
import { startDomainJobScheduler } from "./schedulers/domainJob.scheduler.js";
import { initContractGenerationListener } from "./services/contract/contractGenerationListener.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

dotenv.config({ override: true });
validateEnv();

const app = express();
const PORT = process.env.PORT || 8080;
const BODY_LIMIT = process.env.BODY_LIMIT || "2mb";
const RAW_BODY_CAPTURE_PATHS = [
  "/api/payments/sepay-webhook",
  "/api/payments/sepay-webhook-refund",
  "/api/subscriptions/webhook/sepay",
];

const CORS_ALLOW_ALL = String(process.env.CORS_ALLOW_ALL || "false") === "true";
const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === "production";
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";

// Trust first proxy hop (nginx, load balancer, cloud platform, ngrok)
// "loopback" = chỉ trust localhost (127.0.0.1, ::1), đủ cho dev + ngrok
app.set("trust proxy", "loopback");

const devDefaultOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8083",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8083",
  "exp://localhost:8083",
  "exp://127.0.0.1:8083",
  "exps://localhost:8083",
  "exps://127.0.0.1:8083",
];
const allowedOriginPatterns = isProduction
  ? configuredOrigins
  : [...devDefaultOrigins, ...configuredOrigins];

if (isProduction && !CORS_ALLOW_ALL && allowedOriginPatterns.length === 0) {
  throw new Error(
    "[CORS] Thiếu CORS_ORIGINS trong production (hoặc bật CORS_ALLOW_ALL=true)",
  );
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const originPatternToRegex = (pattern) => {
  const wildcardEscaped = pattern
    .split("*")
    .map((part) => escapeRegex(part))
    .join(".*");

  return new RegExp(`^${wildcardEscaped}$`, "i");
};

const isOriginAllowed = (origin) => {
  // Native apps (APK), Postman, server-to-server thường không gửi Origin.
  if (!origin) return true;
  if (CORS_ALLOW_ALL) return true;

  return allowedOriginPatterns.some((pattern) => {
    if (pattern === "*") return true;
    if (!pattern.includes("*")) return pattern === origin;
    return originPatternToRegex(pattern).test(origin);
  });
};

app.disable("x-powered-by");
app.use(compression());

const shouldCaptureRawBody = (req) => {
  const requestUrl = req.originalUrl || req.url || "";
  return RAW_BODY_CAPTURE_PATHS.some((path) => requestUrl.startsWith(path));
};

const captureRawBody = (req, _res, buffer) => {
  if (shouldCaptureRawBody(req) && buffer?.length) {
    req.rawBody = buffer.toString("utf8");
  }
};

const cloudinaryDomains = CLOUDINARY_CLOUD_NAME
  ? ["https://res.cloudinary.com"]
  : [];

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: [
          "'self'",
          "data:",
          "https://*.googleusercontent.com",
          ...cloudinaryDomains,
        ],
        connectSrc: [
          "'self'",
          ...allowedOriginPatterns,
          ...allowedOriginPatterns.map((o) => o.replace(/^http/, "ws")),
        ],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", ...cloudinaryDomains],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: isProduction ? true : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: isProduction
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
  }),
);
app.use(express.json({ limit: BODY_LIMIT, verify: captureRawBody }));
app.use(express.urlencoded({ limit: BODY_LIMIT, extended: true, verify: captureRawBody }));
app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  }),
);

registerRateLimiters(app);
registerApiRoutes(app);

app.get("/", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      data: {
        name: pkg.name,
        version: pkg.version,
        database: "Connected",
      },
      message: "Server is running",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: "Server running but database connection failed",
      errorCode: "DATABASE_CONNECTION_ERROR",
    });
  }
});

app.use(errorHandler);

initNotificationService();
initContractGenerationListener();

const httpServer = createServer(app);
const io = initSocketIO(httpServer, allowedOriginPatterns);

httpServer.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  startPendingBookingExpireScheduler();
  startTripAutoCompleteScheduler();
  startSubscriptionRenewalReminderScheduler();
  startSubscriptionGracePeriodScheduler();
  startSubscriptionPastDueScheduler();
  startSubscriptionFeatureLockScheduler();
  startSubscriptionStatsScheduler();
  startDomainJobScheduler();
});

export default app;
export { io };
