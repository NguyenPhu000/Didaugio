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
import businessServiceRoutes from "./routes/businessServiceRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import voucherRoutes from "./routes/voucherRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import { authLimiter, apiLimiter } from "./middlewares/rateLimitMiddleware.js";
import logger from "./config/logger.js";
import prisma from "./config/prismaClient.js";
import { initNotificationService } from "./services/notificationService.js";
import { authenticateOptional } from "./middlewares/authMiddleware.js";
import appService from "./services/appService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const BODY_LIMIT = "100mb";

app.use(helmet());
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ limit: BODY_LIMIT, extended: true }));
app.use(
  cors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  }),
);

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/google", authLimiter);
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
app.use("/api/business/services", businessServiceRoutes);
app.use("/api/business/bookings", bookingRoutes);
app.use("/api/business/vouchers", voucherRoutes);
app.use("/api/business/reviews", reviewRoutes);
app.use("/api/business", businessRoutes);
app.use("/api", userPermissionRoutes);
app.use("/api", userRoutes);

app.post("/api/feedback", authenticateOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || null;
    const data = await appService.submitFeedback({
      userId,
      reportType: req.body?.reportType,
      title: req.body?.title,
      content: req.body?.content,
      targetType: req.body?.targetType,
      targetId: req.body?.targetId,
      screenshot: req.body?.screenshot,
    });
    res.status(201).json({ success: true, data, message: "Gửi phản hồi thành công" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Không thể gửi phản hồi" });
  }
});

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
