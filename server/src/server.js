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
import errorHandler from "./middlewares/errorHandler.js";
import prisma from "./config/prismaClient.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware - Cấu hình cho Base64 images (Rule 5.6)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/email-verifications", emailVerificationRoutes);
app.use("/api/password-resets", passwordResetRoutes);
app.use("/api/login-history", loginHistoryRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
