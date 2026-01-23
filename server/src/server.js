import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
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
import boundaryRoutes from "./routes/boundaryRoutes.js"; // Boundary routes (ranh giới địa lý)
import settingsRoutes from "./routes/settingsRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import prisma from "./config/prismaClient.js";
import { initNotificationService } from "./services/notificationService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware - Cấu hình cho Base64 images (Rule 5.6)
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cors());
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

// Routes
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
app.use("/api/boundaries", boundaryRoutes); // Map boundaries & GeoJSON
app.use("/api/settings", settingsRoutes); // System settings & configuration
app.use("/api", userPermissionRoutes);
app.use("/api", userRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Health check & Test Database Connection
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

// Initialize Services
initNotificationService();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
