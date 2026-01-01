import express from "express";
import * as emailVerificationController from "../controllers/emailVerificationController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/email-verifications
 * @desc    Lấy danh sách email verifications (sắp xếp DESC - mới nhất lên đầu)
 * @access  Private (Admin)
 * @query   page, limit, userId, status
 */
router.get("/", authenticate, emailVerificationController.getAll);

/**
 * @route   POST /api/email-verifications
 * @desc    Tạo token xác thực email mới (admin hoặc resend)
 * @access  Private (Admin)
 * @body    { userId, email }
 */
router.post("/", authenticate, emailVerificationController.create);

/**
 * @route   POST /api/email-verifications/verify
 * @desc    Xác thực email bằng token (public route - không cần auth)
 * @access  Public
 * @body    { token }
 */
router.post("/verify", emailVerificationController.verify);

/**
 * @route   POST /api/email-verifications/resend/:userId
 * @desc    Gửi lại email xác thực
 * @access  Private (Admin hoặc User tự resend)
 */
router.post(
  "/resend/:userId",
  authenticate,
  emailVerificationController.resend
);

export default router;
