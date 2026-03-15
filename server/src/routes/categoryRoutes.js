import express from "express";
import * as categoryController from "../controllers/categoryController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";
import { auditLog } from "../middlewares/auditLogMiddleware.js";
import { blockGuestFromAdmin } from "../middlewares/blockGuestFromAdmin.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middlewares/validateSchema.js";
import {
  assignCategoryTagsSchema,
  categoryIdParamSchema,
  categorySlugParamSchema,
  createCategorySchema,
  getCategoriesQuerySchema,
  getCategoryTreeQuerySchema,
  updateCategorySchema,
} from "../models/schemas/categorySchema.js";

const router = express.Router();

router.get(
  "/",
  validateQuery(getCategoriesQuerySchema),
  categoryController.getCategories,
);
router.get(
  "/tree",
  validateQuery(getCategoryTreeQuerySchema),
  categoryController.getCategoryTree,
);
router.get(
  "/slug/:slug",
  validateParams(categorySlugParamSchema),
  categoryController.getCategoryBySlug,
);
router.get(
  "/:id",
  validateParams(categoryIdParamSchema),
  categoryController.getCategoryById,
);
router.get(
  "/:id/path",
  validateParams(categoryIdParamSchema),
  categoryController.getCategoryPath,
);
router.get(
  "/:id/suggested-tags",
  validateParams(categoryIdParamSchema),
  categoryController.getSuggestedTags,
);

router.post(
  "/",
  authenticate,
  blockGuestFromAdmin,
  requirePermission("category.create"),
  validateBody(createCategorySchema),
  auditLog({
    action: "CREATE",
    tableName: "categories",
    getRecordId: (req, body) => body?.data?.id,
    getNewData: (req) => ({ name: req.body.name, slug: req.body.slug }),
  }),
  categoryController.createCategory,
);

router.put(
  "/:id",
  authenticate,
  blockGuestFromAdmin,
  requirePermission("category.update"),
  validateParams(categoryIdParamSchema),
  validateBody(updateCategorySchema),
  auditLog({
    action: "UPDATE",
    tableName: "categories",
    getRecordId: (req) => parseInt(req.params.id),
    getNewData: (req) => req.body,
  }),
  categoryController.updateCategory,
);

router.delete(
  "/:id",
  authenticate,
  blockGuestFromAdmin,
  requirePermission("category.delete"),
  validateParams(categoryIdParamSchema),
  auditLog({
    action: "DELETE",
    tableName: "categories",
    getRecordId: (req) => parseInt(req.params.id),
  }),
  categoryController.deleteCategory,
);

router.post(
  "/:id/tags",
  authenticate,
  blockGuestFromAdmin,
  requirePermission("category.update"),
  validateParams(categoryIdParamSchema),
  validateBody(assignCategoryTagsSchema),
  auditLog({
    action: "ASSIGN_TAGS",
    tableName: "categories",
    getRecordId: (req) => parseInt(req.params.id),
    getNewData: (req) => ({ tagIds: req.body.tagIds }),
  }),
  categoryController.assignTags,
);

export default router;
