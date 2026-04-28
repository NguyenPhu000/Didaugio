import express from "express";
import * as loginHistoryController from "../../controllers/activity/loginHistory.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { blockGuestFromAdmin } from "../../middlewares/blockGuestFromAdmin.js";
import { validateParams } from "../../middlewares/validateSchema.js";
import { idSchema } from "../../models/index.js";
import { z } from "zod";

const router = express.Router();

// 🔒 SECURITY: Block GUEST from viewing login history
router.use(authenticate, blockGuestFromAdmin);

/**
 * @route   GET /api/login-history
 * @desc    Lấy danh sách login history (sắp xếp DESC - mới nhất lên đầu)
 * @access  Private (Admin hoặc User xem history của mình)
 * @query   page, limit, userId, deviceName, isActive
 */
router.get("/", loginHistoryController.getAll);

/**
 * @route   GET /api/login-history/:id
 * @desc    Lấy chi tiết một login session
 * @access  Private (Admin hoặc User xem session của mình)
 */
router.get(
  "/:id",
  validateParams(z.object({ id: idSchema })),
  loginHistoryController.getById,
);

/**
 * @route   POST /api/login-history/revoke
 * @desc    Revoke (vô hiệu hóa) một session
 * @access  Private (Admin hoặc User revoke session của mình)
 * @body    { sessionId }
 */
router.post("/revoke", loginHistoryController.revoke);

/**
 * @route   POST /api/login-history/revoke-all/:userId
 * @desc    Revoke tất cả sessions của user (trừ current session)
 * @access  Private (Admin hoặc User revoke sessions của mình)
 * @body    { currentRefreshToken }
 */
router.post(
  "/revoke-all/:userId",
  validateParams(z.object({ userId: idSchema })),
  loginHistoryController.revokeAll,
);

export default router;
