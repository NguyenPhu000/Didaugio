import express from "express";
import * as emailVerificationController from "../controllers/emailVerificationController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

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
router.get("/", authenticate, emailVerificationController.getAll);

/**
 * @route   POST /api/email-verifications
 * @desc    Tạo token xác thực email mới (Admin only - manual trigger)
 * @access  Private (Admin)
 * @body    { userId, email }
 */
router.post("/", authenticate, emailVerificationController.create);

export default router;
