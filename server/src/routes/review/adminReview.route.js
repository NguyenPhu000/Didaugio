import express from "express";
import { ROLES } from "../../config/constants.js";
import * as controller from "../../controllers/review/adminReview.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
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

const requireAdminRole = (req, res, next) => {
  if (req.user?.roleId === ROLES.SUPER_ADMIN || req.user?.roleId === ROLES.ADMIN) {
    return next();
  }

  return res.status(403).json({
    success: false,
    data: null,
    message: "Bạn không có quyền moderation đánh giá",
    errorCode: "FORBIDDEN",
  });
};

router.use(authenticate);
router.use(requireAdminRole);

router.get("/", validateQuery(adminReviewQuerySchema), controller.getAll);
router.get("/stats", controller.getStats);

router.patch(
  "/:id/moderation",
  validateParams(reviewIdParamSchema),
  validateBody(moderateReviewSchema),
  auditLog({
    action: "MODERATE_REVIEW",
    tableName: "reviews",
    getRecordId: (req) => parseInt(req.params.id, 10),
    getNewData: (req) => ({
      status: req.body.status,
      adminNote: req.body.adminNote || null,
    }),
  }),
  controller.moderateReview,
);

router.patch(
  "/:id/replies/:replyId/moderation",
  validateParams(replyIdParamSchema),
  validateBody(adminModerateReplySchema),
  auditLog({
    action: "ADMIN_MODERATE_REVIEW_REPLY",
    tableName: "review_replies",
    getRecordId: (req) => parseInt(req.params.replyId, 10),
    getNewData: (req) => ({ status: req.body.status }),
  }),
  controller.moderateReply,
);

export default router;
