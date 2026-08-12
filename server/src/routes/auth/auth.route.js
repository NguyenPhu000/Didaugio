import express from "express";
import authController from "../../controllers/auth/auth.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import {
  getCsrfToken,
  verifyBrowserCsrfToken,
} from "../../middlewares/csrfProtection.js";
import {
  getRequestRefreshToken,
  isBrowserSessionRequest,
} from "../../utils/browserSession.js";
import { validateBody, validateParams } from "../../middlewares/validateSchema.js";
import {
  changePasswordSchema,
  browserLogoutSchema,
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

const resolveRefreshToken = (req, _res, next) => {
  const refreshToken = getRequestRefreshToken(req);
  if (isBrowserSessionRequest(req)) {
    req.body = refreshToken ? { refreshToken } : {};
  } else if (refreshToken) {
    req.body = { ...(req.body || {}), refreshToken };
  }
  next();
};

const validateBrowserLogout = validateBody(browserLogoutSchema);
const validateMobileLogout = validateBody(logoutSchema);
const validateLogout = (req, res, next) =>
  (isBrowserSessionRequest(req) ? validateBrowserLogout : validateMobileLogout)(
    req,
    res,
    next,
  );

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
  resolveRefreshToken,
  verifyBrowserCsrfToken,
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
  resolveRefreshToken,
  validateLogout,
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

router.get("/csrf", getCsrfToken);
router.post("/ping", authenticate, authController.pingOnline);

export default router;
