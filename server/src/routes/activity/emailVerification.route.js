import express from "express";
import * as emailVerificationController from "../../controllers/activity/emailVerification.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";

const router = express.Router();

/**
 * EMAIL VERIFICATION ROUTES - CHỈ CHO ADMIN QUẢN LÝ
 *
 * Note: End-user sử dụng /auth/verify-email và /auth/resend-verification
 * Routes này chỉ để admin xem danh sách và quản lý email verifications
 */

/**
 * @route   GET /api/email-verifications
 * @desc    Lấy danh sách email verifications (Admin only)
 * @access  Private (Admin)
 * @query   page, limit, userId, status
 */
router.get(
  "/",
  authenticate,
  hasPermission("email_verification.view"),
  emailVerificationController.getAll,
);

/**
 * @route   POST /api/email-verifications
 * @desc    Tạo token xác thực email mới (Admin only - manual trigger)
 * @access  Private (Admin)
 * @body    { userId, email }
 */
router.post(
  "/",
  authenticate,
  hasPermission("email_verification.create"),
  emailVerificationController.create,
);

/**
 * @route   POST /api/email-verifications/resend/:userId
 * @desc    Gửi lại email xác thực cho user (Admin only)
 * @access  Private (Admin)
 */
router.post(
  "/resend/:userId",
  authenticate,
  hasPermission("email_verification.create"),
  emailVerificationController.resend,
);

/**
 * @route   POST /api/email-verifications/manual-verify/:userId
 * @desc    Xác thực email thủ công cho user (Admin only - không cần token)
 * @access  Private (Admin)
 */
router.post(
  "/manual-verify/:userId",
  authenticate,
  hasPermission("email_verification.create"),
  emailVerificationController.manualVerify,
);

export default router;
