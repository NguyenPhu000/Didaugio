import express from "express";
import * as passwordResetController from "../controllers/passwordResetController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * PASSWORD RESET ROUTES - CHỈ CHO ADMIN XEM DANH SÁCH
 *
 * Note: End-user sử dụng /auth/forgot-password và /auth/reset-password
 * Routes này chỉ để admin quản lý và xem danh sách password resets
 */

/**
 * @route   GET /api/password-resets
 * @desc    Lấy danh sách password resets (Admin only)
 * @access  Private (Admin)
 * @query   page, limit, userId, status
 */
router.get("/", authenticate, passwordResetController.getAll);

export default router;
