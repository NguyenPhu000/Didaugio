import express from "express";
import * as placeController from "../controllers/placeController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";
import { auditLog } from "../middlewares/auditLogMiddleware.js";
import { checkPlaceOwnership } from "../middlewares/placeMiddleware.js";
import { validateBody, validateQuery } from "../middlewares/validateSchema.js";
import {
  createPlaceSchema,
  updatePlaceSchema,
  getPlacesQuerySchema,
  nearbyPlacesQuerySchema,
  approvePlaceSchema,
} from "../models/schemas/placeSchema.js";

const router = express.Router();

/**
 * PLACE ROUTES
 * Base: /api/places
 */

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

// GET /api/places - Lấy danh sách địa điểm (public)
router.get("/", validateQuery(getPlacesQuerySchema), placeController.getPlaces);

// GET /api/places/stats - Thống kê (public hoặc admin)
router.get("/stats", placeController.getStats);

// GET /api/places/check-slug/:slug - Kiểm tra slug (public)
router.get("/check-slug/:slug", placeController.checkSlug);

// GET /api/places/slug/:slug - Lấy theo slug (public)
router.get("/slug/:slug", placeController.getPlaceBySlug);

// GET /api/places/:id - Lấy theo ID (public)
router.get("/:id", placeController.getPlaceById);

// =============================================================================
// AUTHENTICATED ROUTES - Tạo địa điểm
// =============================================================================

// POST /api/places - Tạo địa điểm mới
router.post(
  "/",
  authenticate,
  requirePermission("place.create"),
  validateBody(createPlaceSchema),
  auditLog({
    action: "CREATE",
    tableName: "places",
    getRecordId: (req, body) => body?.data?.id,
    getNewData: (req) => ({
      name: req.body.name,
      categoryId: req.body.categoryId,
      address: req.body.address,
    }),
  }),
  placeController.createPlace
);

// =============================================================================
// OWNER/ADMIN ROUTES - Cập nhật địa điểm
// =============================================================================

// PUT /api/places/:id - Cập nhật địa điểm
router.put(
  "/:id",
  authenticate,
  requirePermission(["place.update", "place.manage_own"]),
  checkPlaceOwnership,
  validateBody(updatePlaceSchema),
  auditLog({
    action: "UPDATE",
    tableName: "places",
    getRecordId: (req) => parseInt(req.params.id),
    getNewData: (req) => req.body,
  }),
  placeController.updatePlace
);

// DELETE /api/places/:id - Xóa địa điểm
router.delete(
  "/:id",
  authenticate,
  requirePermission(["place.delete", "place.manage_own"]),
  checkPlaceOwnership,
  auditLog({
    action: "DELETE",
    tableName: "places",
    getRecordId: (req) => parseInt(req.params.id),
  }),
  placeController.deletePlace
);

// POST /api/places/:id/submit - Gửi duyệt
router.post(
  "/:id/submit",
  authenticate,
  requirePermission(["place.update", "place.manage_own"]),
  checkPlaceOwnership,
  auditLog({
    action: "SUBMIT_REVIEW",
    tableName: "places",
    getRecordId: (req) => parseInt(req.params.id),
  }),
  placeController.submitForReview
);

// =============================================================================
// ADMIN ROUTES - Quản lý trạng thái
// =============================================================================

// PUT /api/places/:id/approve - Duyệt địa điểm
router.put(
  "/:id/approve",
  authenticate,
  requirePermission("place.approve"),
  auditLog({
    action: "APPROVE",
    tableName: "places",
    getRecordId: (req) => parseInt(req.params.id),
  }),
  placeController.approvePlace
);

// PUT /api/places/:id/reject - Từ chối địa điểm
router.put(
  "/:id/reject",
  authenticate,
  requirePermission("place.approve"),
  auditLog({
    action: "REJECT",
    tableName: "places",
    getRecordId: (req) => parseInt(req.params.id),
    getNewData: (req) => ({ reason: req.body.reason }),
  }),
  placeController.rejectPlace
);

// PUT /api/places/:id/status - Đổi trạng thái
router.put(
  "/:id/status",
  authenticate,
  requirePermission("place.update"),
  auditLog({
    action: "UPDATE_STATUS",
    tableName: "places",
    getRecordId: (req) => parseInt(req.params.id),
    getNewData: (req) => ({ status: req.body.status }),
  }),
  placeController.updateStatus
);

// PUT /api/places/:id/feature - Đánh dấu nổi bật
router.put(
  "/:id/feature",
  authenticate,
  requirePermission("place.feature"),
  auditLog({
    action: "TOGGLE_FEATURED",
    tableName: "places",
    getRecordId: (req) => parseInt(req.params.id),
    getNewData: (req) => ({ isFeatured: req.body.isFeatured }),
  }),
  placeController.toggleFeatured
);

// =============================================================================
// IMAGE ROUTES
// =============================================================================

// POST /api/places/:id/images - Thêm ảnh
router.post(
  "/:id/images",
  authenticate,
  requirePermission(["place.update", "place.manage_own"]),
  checkPlaceOwnership,
  placeController.addImages
);

// PUT /api/places/:id/images/reorder - Sắp xếp ảnh
router.put(
  "/:id/images/reorder",
  authenticate,
  requirePermission(["place.update", "place.manage_own"]),
  checkPlaceOwnership,
  placeController.reorderImages
);

// PUT /api/places/:id/images/:imageId/cover - Đặt làm ảnh bìa
router.put(
  "/:id/images/:imageId/cover",
  authenticate,
  requirePermission(["place.update", "place.manage_own"]),
  checkPlaceOwnership,
  placeController.setCoverImage
);

// DELETE /api/places/:id/images/:imageId - Xóa ảnh
router.delete(
  "/:id/images/:imageId",
  authenticate,
  requirePermission(["place.update", "place.manage_own"]),
  checkPlaceOwnership,
  placeController.deleteImage
);

export default router;
