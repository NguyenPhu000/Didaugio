import express from "express";
import authController from "../controllers/authController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// AUTH ROUTES

// PUBLIC ROUTES (không cần đăng nhập)

// Đăng ký
router.post("/register", authController.register);

// Đăng nhập
router.post("/login", authController.login);

// Đăng nhập bằng Google OAuth — mobile app gửi id_token
router.post("/google", authController.loginGoogle);

// Google OAuth 2.0 Web Flow (server-side Authorization Code Flow)
// Bước 1: App mở browser → server redirect → Google sign-in
router.get("/google/web", authController.initiateGoogleOAuth);
// Bước 2: Google redirect về đây → server tạo JWT → deep link về app
router.get("/google/web/callback", authController.googleOAuthCallback);

// Refresh token - lấy access token mới
router.post("/refresh", authController.refreshToken);

// Quên mật khẩu - gửi email reset
router.post("/forgot-password", authController.forgotPassword);

// Đặt lại mật khẩu (từ link email)
router.post("/reset-password", authController.resetPassword);

// Xác thực email (từ link email)
router.post("/verify-email", authController.verifyEmail);

// PROTECTED ROUTES (cần đăng nhập)

// Lấy thông tin user hiện tại
router.get("/me", authenticate, authController.getMe);

// Đổi mật khẩu
router.post("/change-password", authenticate, authController.changePassword);

// Gửi lại email xác thực
router.post(
  "/resend-verification",
  authenticate,
  authController.resendVerification,
);

// Đăng xuất (xóa session hiện tại)
router.post("/logout", authenticate, authController.logout);

// Đăng xuất tất cả thiết bị
router.post("/logout-all", authenticate, authController.logoutAll);

// Lấy danh sách session đang hoạt động
router.get("/sessions", authenticate, authController.getSessions);

// Xóa session cụ thể (đăng xuất thiết bị khác)
router.delete(
  "/sessions/:sessionId",
  authenticate,
  authController.revokeSession,
);

export default router;
