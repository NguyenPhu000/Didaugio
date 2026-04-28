import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import errorHandler from "./middlewares/errorHandler.js";
import logger from "./config/logger.js";
import prisma from "./config/prismaClient.js";
import { initNotificationService } from "./services/notification/notification.service.js";
import { initSocketIO } from "./config/socketIO.js";
import { validateEnv } from "./config/validateEnv.js";
import { registerApiRoutes, registerRateLimiters } from "./routes/index.js";

dotenv.config({ override: true });
validateEnv();

const app = express();
const PORT = process.env.PORT || 8080;
const BODY_LIMIT = process.env.BODY_LIMIT || "10mb";

const CORS_ALLOW_ALL = String(process.env.CORS_ALLOW_ALL || "false") === "true";
const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === "production";

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

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.googleusercontent.com"],
        connectSrc: ["'self'", ...allowedOriginPatterns, ...allowedOriginPatterns.map(o => o.replace(/^http/, "ws"))],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "https://res.cloudinary.com"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: isProduction ? [] : null,
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
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ limit: BODY_LIMIT, extended: true }));
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
        name: "Di Dau Gio API Server",
        version: "1.0.0",
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

const httpServer = createServer(app);
const io = initSocketIO(httpServer, allowedOriginPatterns);

httpServer.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
export { io };
