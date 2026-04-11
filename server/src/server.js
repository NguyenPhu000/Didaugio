import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import auditLogRoutes from "./routes/auditLogRoutes.js";
import emailVerificationRoutes from "./routes/emailVerificationRoutes.js";
import passwordResetRoutes from "./routes/passwordResetRoutes.js";
import loginHistoryRoutes from "./routes/loginHistoryRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import permissionRoutes from "./routes/permissionRoutes.js";
import userPermissionRoutes from "./routes/userPermissionRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import tagRoutes from "./routes/tagRoutes.js";
import placeRoutes from "./routes/placeRoutes.js";
import districtRoutes from "./routes/districtRoutes.js";
import wardRoutes from "./routes/wardRoutes.js";
import boundaryRoutes from "./routes/boundaryRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import businessRoutes from "./routes/businessRoutes.js";
import businessOfferingRoutes from "./routes/businessOfferingRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import autoApproveRuleRoutes from "./routes/autoApproveRuleRoutes.js";
import voucherRoutes from "./routes/voucherRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import {
  authLimiter,
  apiLimiter,
  refreshLimiter,
  recoveryLimiter,
} from "./middlewares/rateLimitMiddleware.js";
import logger from "./config/logger.js";
import prisma from "./config/prismaClient.js";
import { initNotificationService } from "./services/notificationService.js";
import { validateEnv } from "./config/validateEnv.js";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config({ override: true });
validateEnv();

const app = express();
const PORT = process.env.PORT || 8080;
const BODY_LIMIT = process.env.BODY_LIMIT || "10mb";

const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === "production";

if (isProduction && configuredOrigins.length === 0) {
  throw new Error("[CORS] Thiếu CORS_ORIGINS trong production");
}

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
const allowedOrigins = isProduction
  ? configuredOrigins
  : Array.from(new Set([...devDefaultOrigins, ...configuredOrigins]));

const isAllowedExpoDevOrigin = (origin) => {
  if (isProduction || !origin) return false;

  // Allow Expo/dev-client origins on private LAN for local development.
  return (
    /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/i.test(
      origin,
    ) ||
    /^exps?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/i.test(
      origin,
    )
  );
};

app.use(helmet());
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ limit: BODY_LIMIT, extended: true }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (isAllowedExpoDevOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  }),
);

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/google", authLimiter);
app.use("/api/auth/refresh", refreshLimiter);
app.use("/api/auth/forgot-password", recoveryLimiter);
app.use("/api/auth/reset-password", recoveryLimiter);
app.use("/api/auth/resend-verification-public", recoveryLimiter);
app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/email-verifications", emailVerificationRoutes);
app.use("/api/password-resets", passwordResetRoutes);
app.use("/api/login-history", loginHistoryRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/places", placeRoutes);
app.use("/api/districts", districtRoutes);
app.use("/api/wards", wardRoutes);
app.use("/api/boundaries", boundaryRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/business/services", businessOfferingRoutes);
app.use("/api/business/bookings", bookingRoutes);
app.use("/api/business/booking-auto-rules", autoApproveRuleRoutes);
app.use("/api/business/vouchers", voucherRoutes);
app.use("/api/business/reviews", reviewRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api", userPermissionRoutes);
app.use("/api", userRoutes);

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

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
