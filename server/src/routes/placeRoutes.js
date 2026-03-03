import express from "express";
import * as placeController from "../controllers/placeController.js";
import {
  authenticate,
  authenticateOptional,
} from "../middlewares/authMiddleware.js";
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

router.get("/home", placeController.getHomeData);
router.get("/services", placeController.getBusinessServices);

router.get(
  "/",
  authenticateOptional,
  validateQuery(getPlacesQuerySchema),
  placeController.getPlaces,
);

router.get("/stats", placeController.getStats);

router.get("/check-slug/:slug", placeController.checkSlug);

router.get(
  "/nearby",
  validateQuery(nearbyPlacesQuerySchema),
  placeController.getNearbyPlaces,
);

router.get("/slug/:slug", placeController.getPlaceBySlug);

router.get("/:id", placeController.getPlaceById);

router.get("/:id/reviews", placeController.getPlaceReviews);
router.post("/:id/reviews", authenticate, placeController.createReview);

router.post(
  "/",
  authenticate,
  requirePermission("places.create"),
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
  placeController.createPlace,
);

router.put(
  "/:id",
  authenticate,
  requirePermission("places.edit"),
  checkPlaceOwnership,
  validateBody(updatePlaceSchema),
  auditLog({
    action: "UPDATE",
    tableName: "places",
    getRecordId: (req) => parseInt(req.params.id),
    getNewData: (req) => req.body,
  }),
  placeController.updatePlace,
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("places.delete"),
  checkPlaceOwnership,
  auditLog({
    action: "DELETE",
    tableName: "places",
    getRecordId: (req) => parseInt(req.params.id),
  }),
  placeController.deletePlace,
);

router.post(
  "/:id/submit",
  authenticate,
  requirePermission("places.edit"),
  checkPlaceOwnership,
  auditLog({
    action: "SUBMIT_REVIEW",
    tableName: "places",
    getRecordId: (req) => parseInt(req.params.id),
  }),
  placeController.submitForReview,
);

router.put(
  "/:id/approve",
  authenticate,
  requirePermission("places.approve"),
  auditLog({
    action: "APPROVE",
    tableName: "places",
    getRecordId: (req) => parseInt(req.params.id),
  }),
  placeController.approvePlace,
);

router.put(
  "/:id/reject",
  authenticate,
  requirePermission("places.reject"),
  auditLog({
    action: "REJECT",
    tableName: "places",
    getRecordId: (req) => parseInt(req.params.id),
    getNewData: (req) => ({ reason: req.body.reason }),
  }),
  placeController.rejectPlace,
);

router.put(
  "/:id/status",
  authenticate,
  requirePermission("places.edit"),
  auditLog({
    action: "UPDATE_STATUS",
    tableName: "places",
    getRecordId: (req) => parseInt(req.params.id),
    getNewData: (req) => ({ status: req.body.status }),
  }),
  placeController.updateStatus,
);

router.put(
  "/:id/feature",
  authenticate,
  requirePermission("places.feature"),
  auditLog({
    action: "TOGGLE_FEATURED",
    tableName: "places",
    getRecordId: (req) => parseInt(req.params.id),
    getNewData: (req) => ({ isFeatured: req.body.isFeatured }),
  }),
  placeController.toggleFeatured,
);

router.post(
  "/:id/images",
  authenticate,
  requirePermission("places.manage_images"),
  checkPlaceOwnership,
  placeController.addImages,
);

router.put(
  "/:id/images/reorder",
  authenticate,
  requirePermission("places.manage_images"),
  checkPlaceOwnership,
  placeController.reorderImages,
);

router.put(
  "/:id/images/:imageId/cover",
  authenticate,
  requirePermission("places.manage_images"),
  checkPlaceOwnership,
  placeController.setCoverImage,
);

router.delete(
  "/:id/images/:imageId",
  authenticate,
  requirePermission("places.manage_images"),
  checkPlaceOwnership,
  placeController.deleteImage,
);

export default router;
