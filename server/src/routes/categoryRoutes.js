import express from "express";
import * as categoryController from "../controllers/categoryController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";
import { auditLog } from "../middlewares/auditLogMiddleware.js";

const router = express.Router();

/**
 * CATEGORY ROUTES
 * Base: /api/categories
 */

// Public routes
router.get("/", categoryController.getCategories);
router.get("/tree", categoryController.getCategoryTree);
router.get("/slug/:slug", categoryController.getCategoryBySlug);
router.get("/:id", categoryController.getCategoryById);
router.get("/:id/path", categoryController.getCategoryPath);
router.get("/:id/suggested-tags", categoryController.getSuggestedTags);

// Admin routes - Require authentication + permission
router.post(
  "/",
  authenticate,
  requirePermission("category.create"),
  auditLog({
    action: "CREATE",
    tableName: "categories",
    getRecordId: (req, body) => body?.data?.id,
    getNewData: (req) => ({ name: req.body.name, slug: req.body.slug }),
  }),
  categoryController.createCategory
);

router.put(
  "/:id",
  authenticate,
  requirePermission("category.update"),
  auditLog({
    action: "UPDATE",
    tableName: "categories",
    getRecordId: (req) => parseInt(req.params.id),
    getNewData: (req) => req.body,
  }),
  categoryController.updateCategory
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("category.delete"),
  auditLog({
    action: "DELETE",
    tableName: "categories",
    getRecordId: (req) => parseInt(req.params.id),
  }),
  categoryController.deleteCategory
);

router.post(
  "/:id/tags",
  authenticate,
  requirePermission("category.update"),
  auditLog({
    action: "ASSIGN_TAGS",
    tableName: "categories",
    getRecordId: (req) => parseInt(req.params.id),
    getNewData: (req) => ({ tagIds: req.body.tagIds }),
  }),
  categoryController.assignTags
);

export default router;
