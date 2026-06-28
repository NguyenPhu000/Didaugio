import express from "express";
import * as bannerController from "../../controllers/banner/banner.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import {
  validateBody,
  validateParams,
} from "../../middlewares/validateSchema.js";
import {
  bannerIdParamSchema,
  createBannerSchema,
  updateBannerSchema,
} from "../../models/index.js";

const router = express.Router();

// Tất cả routes đều yêu cầu authentication + permission
router.use(authenticate, hasPermission("system.manage_banners"));

// GET /api/banners — Lấy danh sách banner
router.get("/", bannerController.getBanners);

// POST /api/banners — Tạo banner mới
router.post(
  "/",
  validateBody(createBannerSchema),
  bannerController.createBanner
);

// PUT /api/banners/:id — Cập nhật banner
router.put(
  "/:id",
  validateParams(bannerIdParamSchema),
  validateBody(updateBannerSchema),
  bannerController.updateBanner
);

// DELETE /api/banners/:id — Xóa banner
router.delete(
  "/:id",
  validateParams(bannerIdParamSchema),
  bannerController.deleteBanner
);

export default router;
