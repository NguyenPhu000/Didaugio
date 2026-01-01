import express from "express";
import * as passwordResetController from "../controllers/passwordResetController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/password-resets
 * @desc    Lấy danh sách password resets (sắp xếp DESC - mới nhất lên đầu)
 * @access  Private (Admin)
 * @query   page, limit, userId, status
 */
router.get("/", authenticate, passwordResetController.getAll);

/**
 * @route   POST /api/password-resets
 * @desc    Tạo yêu cầu reset password (public route - không cần auth)
 * @access  Public
 * @body    { email }
 */
router.post("/", passwordResetController.create);

/**
 * @route   POST /api/password-resets/reset
 * @desc    Reset password bằng token (public route - không cần auth)
 * @access  Public
 * @body    { token, newPassword }
 */
router.post("/reset", passwordResetController.reset);

export default router;
