import express from "express";
import * as controller from "../../controllers/review/adminReview.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import { auditLog } from "../../middlewares/auditLogMiddleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validateSchema.js";
import {
  adminModerateReplySchema,
  adminReviewQuerySchema,
  moderateReviewSchema,
  replyIdParamSchema,
  reviewIdParamSchema,
} from "../../models/index.js";

const router = express.Router();

router.use(authenticate);

// Review moderation permission: reviews.moderate (new) or reviews.hide (backward compat)
const moderationAccess = ["reviews.moderate", "reviews.hide"];

router.get("/", hasPermission(moderationAccess), validateQuery(adminReviewQuerySchema), controller.getAll);
router.get("/stats", hasPermission(moderationAccess), controller.getStats);

router.patch(
  "/:id/moderation",
  hasPermission(moderationAccess),
  validateParams(reviewIdParamSchema),
  validateBody(moderateReviewSchema),
  auditLog({
    action: "MODERATE_REVIEW",
    tableName: "reviews",
    getRecordId: (req) => parseInt(req.params.id, 10),
    getNewData: (req) => ({
      status: req.body.status,
      adminNote: req.body.adminNote ?? null,
      moderationReason: req.body.moderationReason ?? null,
    }),
  }),
  controller.moderateReview,
);

router.patch(
  "/:id/replies/:replyId/moderation",
  hasPermission(moderationAccess),
  validateParams(replyIdParamSchema),
  validateBody(adminModerateReplySchema),
  auditLog({
    action: "ADMIN_MODERATE_REVIEW_REPLY",
    tableName: "review_replies",
    getRecordId: (req) => parseInt(req.params.replyId, 10),
    getNewData: (req) => ({
      status: req.body.status,
      moderationReason: req.body.moderationReason ?? null,
    }),
  }),
  controller.moderateReply,
);

export default router;

