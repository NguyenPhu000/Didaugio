import express from "express";
import * as tagController from "../controllers/tagController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";
import { blockGuestFromAdmin } from "../middlewares/blockGuestFromAdmin.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middlewares/validateSchema.js";
import {
  bulkCreateTagsSchema,
  createTagSchema,
  getPopularTagsQuerySchema,
  getTagsQuerySchema,
  tagIdParamSchema,
  tagSlugParamSchema,
  tagSuggestParamSchema,
  updateTagSchema,
} from "../models/index.js";

const router = express.Router();

/**
 * TAG ROUTES
 * Base: /api/tags
 */

// Public routes
router.get("/", validateQuery(getTagsQuerySchema), tagController.getTags);
router.get(
  "/popular",
  validateQuery(getPopularTagsQuerySchema),
  tagController.getPopularTags,
);
router.get(
  "/suggest/:categoryId",
  validateParams(tagSuggestParamSchema),
  tagController.getSuggestedTagsByCategory,
);
router.get(
  "/slug/:slug",
  validateParams(tagSlugParamSchema),
  tagController.getTagBySlug,
);
router.get("/:id", validateParams(tagIdParamSchema), tagController.getTagById);

// Admin routes - Require authentication + permission (categories.manage_tags là quyền quản lý tag trong DB)
router.post(
  "/",
  authenticate,
  blockGuestFromAdmin,
  requirePermission("categories.manage_tags"),
  validateBody(createTagSchema),
  tagController.createTag,
);

router.post(
  "/bulk",
  authenticate,
  blockGuestFromAdmin,
  requirePermission("categories.manage_tags"),
  validateBody(bulkCreateTagsSchema),
  tagController.bulkCreateTags,
);

router.put(
  "/:id",
  authenticate,
  blockGuestFromAdmin,
  requirePermission("categories.manage_tags"),
  validateParams(tagIdParamSchema),
  validateBody(updateTagSchema),
  tagController.updateTag,
);

router.delete(
  "/:id",
  authenticate,
  blockGuestFromAdmin,
  requirePermission("categories.manage_tags"),
  validateParams(tagIdParamSchema),
  tagController.deleteTag,
);

router.post(
  "/:id/recalculate",
  authenticate,
  blockGuestFromAdmin,
  requirePermission("categories.manage_tags"),
  validateParams(tagIdParamSchema),
  tagController.recalculateUsageCount,
);

export default router;
