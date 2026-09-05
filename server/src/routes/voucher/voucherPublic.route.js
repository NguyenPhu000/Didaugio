import express from "express";
import * as controller from "../../controllers/voucher/voucherPublic.controller.js";
import { authenticate, authenticateOptional } from "../../middlewares/authMiddleware.js";
import {
  validateBody,
  validateQuery,
} from "../../middlewares/validateSchema.js";
import {
  applicableVoucherQuerySchema,
  validateVoucherBodySchema,
} from "../../models/schemas/voucher/voucher.schema.js";

const router = express.Router();

/**
 * GET /api/vouchers/public
 * Public cho User (kể cả khách chưa đăng nhập) xem danh sách voucher
 * đang khả dụng cho 1 service/business.
 */
router.get(
  "/public",
  authenticateOptional,
  validateQuery(applicableVoucherQuerySchema),
  controller.getPublicVouchers,
);

/**
 * POST /api/vouchers/validate
 * Yêu cầu đăng nhập để tính `perUserLimit` chính xác.
 */
router.post(
  "/validate",
  authenticate,
  validateBody(validateVoucherBodySchema),
  controller.validatePublicVoucher,
);

export default router;
