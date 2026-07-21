import express from "express";
import * as tagGroupController from "../../controllers/tag/tagGroup.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { blockGuestFromAdmin } from "../../middlewares/blockGuestFromAdmin.js";
import { requirePermission } from "../../middlewares/permissionMiddleware.js";
import { validateBody, validateParams } from "../../middlewares/validateSchema.js";
import {
  createTagGroupSchema,
  tagGroupIdParamSchema,
  updateTagGroupSchema,
} from "../../models/index.js";

const router = express.Router();

router.get("/", tagGroupController.getTagGroups);

router.post(
  "/",
  authenticate,
  blockGuestFromAdmin,
  requirePermission("categories.manage_tags"),
  validateBody(createTagGroupSchema),
  tagGroupController.createTagGroup,
);

router.patch(
  "/:id",
  authenticate,
  blockGuestFromAdmin,
  requirePermission("categories.manage_tags"),
  validateParams(tagGroupIdParamSchema),
  validateBody(updateTagGroupSchema),
  tagGroupController.updateTagGroup,
);

router.delete(
  "/:id",
  authenticate,
  blockGuestFromAdmin,
  requirePermission("categories.manage_tags"),
  validateParams(tagGroupIdParamSchema),
  tagGroupController.deleteTagGroup,
);

export default router;
