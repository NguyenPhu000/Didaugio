import "dotenv/config";
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
import { registerHealthRoutes } from "./health/health.routes.js";
import { getRedisClient, closeRedisClient } from "./config/redisClient.js";
import { requestIdMiddleware } from "./middlewares/requestContext.js";
import { registerMetrics } from "./observability/metrics.js";
import { startPendingBookingExpireScheduler } from "./schedulers/pendingBookingExpire.scheduler.js";
import { startTripAutoCompleteScheduler } from "./schedulers/tripAutoComplete.scheduler.js";
import { startSubscriptionRenewalReminderScheduler } from "./schedulers/subscriptionRenewalReminder.scheduler.js";
import { startSubscriptionGracePeriodScheduler } from "./schedulers/subscriptionGracePeriod.scheduler.js";
import { startSubscriptionPastDueScheduler } from "./schedulers/subscriptionPastDue.scheduler.js";
import { startSubscriptionFeatureLockScheduler } from "./schedulers/subscriptionFeatureLock.scheduler.js";
import { startSubscriptionStatsScheduler } from "./schedulers/subscriptionStats.scheduler.js";
import { startDomainJobScheduler } from "./schedulers/domainJob.scheduler.js";
import { createSchedulerLeader } from "./schedulers/schedulerLeader.js";
import { initContractGenerationListener } from "./services/contract/contractGenerationListener.js";
import { ensureDefaultAiConfig } from "./services/adminAi/index.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

dotenv.config({ override: true });
validateEnv();

const app = express();
app.use(requestIdMiddleware);
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

// Trust proxy configuration
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : (process.env.TRUST_PROXY || "loopback"));

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
registerMetrics(app, {
  enabled: String(process.env.METRICS_ENABLED || "false") === "true",
  collectRuntimeMetrics: String(process.env.METRICS_ENABLED || "false") === "true",
  prisma,
});
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
        objectSrc: ["'self'", "blob:"],
        mediaSrc: ["'self'", ...cloudinaryDomains],
        frameSrc: ["'self'", "blob:", "data:"],
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
    exposedHeaders: ["Content-Disposition", "Content-Type"],
  }),
);

const redis = getRedisClient();
registerHealthRoutes(app, {
  prisma,
  redis,
  routingUrl: process.env.OSRM_URL || "http://localhost:5000",
});

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
const schedulerLeader = createSchedulerLeader({
  redis,
  starters: [
    startPendingBookingExpireScheduler,
    startTripAutoCompleteScheduler,
    startSubscriptionRenewalReminderScheduler,
    startSubscriptionGracePeriodScheduler,
    startSubscriptionPastDueScheduler,
    startSubscriptionFeatureLockScheduler,
    startSubscriptionStatsScheduler,
    startDomainJobScheduler,
  ],
});

let isBootCompleted = false;

ensureDefaultAiConfig()
  .then(() => {
    isBootCompleted = true;
    logger.info("[boot] Default AI configuration initialized successfully");
  })
  .catch((err) => {
    isBootCompleted = true;
    logger.warn("[boot] Default AI configuration failed, using fallback", { error: err.message });
  });

httpServer.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  schedulerLeader.start();
});

const gracefulShutdown = async (signal) => {
  logger.info(`[Shutdown] Received signal ${signal}. Starting graceful shutdown...`);

  // 1. Safety timeout: if requests do not finish within 10s, force exit. Unref so timer does not block event loop.
  setTimeout(() => {
    logger.error("[Shutdown] Timeout of 10s exceeded, forcing process exit.");
    process.exit(1);
  }, 10000).unref();

  // 2. Stop accepting new HTTP connections
  httpServer.close(async (err) => {
    if (err) logger.error("[Shutdown] Error closing HTTP server", { error: err.message });

    try {
      logger.info("[Shutdown] HTTP server closed. Stopping background schedulers & closing DB connections...");
      await schedulerLeader.stop();
      await prisma.$disconnect();
      await closeRedisClient();

      logger.info("[Shutdown] Graceful shutdown completed cleanly. Process exiting (0).");
      process.exit(0);
    } catch (shutdownErr) {
      logger.error("[Shutdown] Error during cleanup", { error: shutdownErr.message });
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export { io, isBootCompleted };
export default app;
