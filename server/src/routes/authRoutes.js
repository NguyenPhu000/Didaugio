import express from "express";
import authController from "../controllers/authController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google", authController.loginGoogle);
router.post("/google/exchange", authController.exchangeGoogleCode);
router.get("/google/web", authController.initiateGoogleOAuth);
router.get("/google/web/callback", authController.googleOAuthCallback);
router.post("/refresh", authController.refreshToken);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/verify-email", authController.verifyEmail);
router.post(
  "/resend-verification-public",
  authController.resendVerificationPublic,
);

router.get("/me", authenticate, authController.getMe);
router.post("/change-password", authenticate, authController.changePassword);
router.post(
  "/resend-verification",
  authenticate,
  authController.resendVerification,
);
router.post("/logout", authenticate, authController.logout);
router.post("/logout-all", authenticate, authController.logoutAll);
router.get("/sessions", authenticate, authController.getSessions);
router.delete(
  "/sessions/:sessionId",
  authenticate,
  authController.revokeSession,
);

export default router;
