import express from "express";
import authController from "../../controllers/auth/auth.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { getCsrfToken } from "../../middlewares/csrfProtection.js";
import { validateBody, validateParams } from "../../middlewares/validateSchema.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginGoogleSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
  resendVerificationPublicSchema,
  resetPasswordSchema,
  revokeSessionParamSchema,
  verifyEmailSchema,
  verifyEmailOtpSchema,
} from "../../models/index.js";

const router = express.Router();

router.post("/register", validateBody(registerSchema), authController.register);
router.post("/register-business", validateBody(registerSchema), authController.registerBusiness);
router.post("/login", validateBody(loginSchema), authController.login);

// Upgrade USER role to BUSINESS role (for mobile users registering business on web)
router.post("/upgrade-to-business", authenticate, authController.upgradeToBusiness);
router.post(
  "/google",
  validateBody(loginGoogleSchema),
  authController.loginGoogle,
);
router.post(
  "/refresh",
  validateBody(refreshTokenSchema),
  authController.refreshToken,
);
router.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  authController.resetPassword,
);
router.post(
  "/verify-email",
  validateBody(verifyEmailSchema),
  authController.verifyEmail,
);
router.post(
  "/verify-email-otp",
  validateBody(verifyEmailOtpSchema),
  authController.verifyEmailOtp,
);
router.post(
  "/resend-verification-public",
  validateBody(resendVerificationPublicSchema),
  authController.resendVerificationPublic,
);

router.get("/me", authenticate, authController.getMe);
router.post(
  "/change-password",
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword,
);
router.post(
  "/resend-verification",
  authenticate,
  authController.resendVerification,
);
router.post(
  "/logout",
  authenticate,
  validateBody(logoutSchema),
  authController.logout,
);
router.post("/logout-all", authenticate, authController.logoutAll);
router.get("/sessions", authenticate, authController.getSessions);
router.delete(
  "/sessions/:sessionId",
  authenticate,
  validateParams(revokeSessionParamSchema),
  authController.revokeSession,
);

router.get("/csrf", authenticate, getCsrfToken);
router.post("/ping", authenticate, authController.pingOnline);

export default router;
