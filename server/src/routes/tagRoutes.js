import express from "express";
import * as tagController from "../controllers/tagController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";

const router = express.Router();

/**
 * TAG ROUTES
 * Base: /api/tags
 */

// Public routes
router.get("/", tagController.getTags);
router.get("/popular", tagController.getPopularTags);
router.get("/suggest/:categoryId", tagController.getSuggestedTagsByCategory);
router.get("/slug/:slug", tagController.getTagBySlug);
router.get("/:id", tagController.getTagById);

// Admin routes - Require authentication + permission
router.post(
  "/",
  authenticate,
  requirePermission("tag.create"),
  tagController.createTag
);

router.post(
  "/bulk",
  authenticate,
  requirePermission("tag.create"),
  tagController.bulkCreateTags
);

router.put(
  "/:id",
  authenticate,
  requirePermission("tag.update"),
  tagController.updateTag
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("tag.delete"),
  tagController.deleteTag
);

router.post(
  "/:id/recalculate",
  authenticate,
  requirePermission("tag.update"),
  tagController.recalculateUsageCount
);

export default router;
