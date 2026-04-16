import express from "express";
import * as controller from "../../controllers/review/review.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import { requireActiveBusiness } from "../../middlewares/requireActiveBusiness.js";
import { auditLog } from "../../middlewares/auditLogMiddleware.js";
import {
  validateBody,
  validateParams,
} from "../../middlewares/validateSchema.js";
import {
  replyReviewSchema,
  updateReplySchema,
  moderateReplySchema,
  reviewIdParamSchema,
  replyIdParamSchema,
} from "../../models/index.js";

const router = express.Router();

router.use(authenticate);
router.use(requireActiveBusiness({ requireContractSigned: true }));

// Business owner: reviews.view | Admin: reviews.view_detail (superset)
const reviewViewPermission = ["reviews.view", "reviews.view_detail"];

router.get("/", hasPermission(reviewViewPermission), controller.getAll);
router.get("/stats", hasPermission(reviewViewPermission), controller.getStats);
router.get(
  "/:id",
  hasPermission("reviews.view_detail"),
  validateParams(reviewIdParamSchema),
  controller.getById,
);

router.post(
  "/:id/reply",
  hasPermission("reviews.reply"),
  validateParams(reviewIdParamSchema),
  validateBody(replyReviewSchema),
  auditLog({
    action: "REPLY",
    tableName: "review_replies",
    getRecordId: (req, body) => body?.data?.id,
    getNewData: (req) => ({ content: req.body.content }),
  }),
  controller.reply,
);

router.put(
  "/:id/replies/:replyId",
  hasPermission("reviews.reply"),
  validateParams(replyIdParamSchema),
  validateBody(updateReplySchema),
  auditLog({
    action: "UPDATE_REPLY",
    tableName: "review_replies",
    getRecordId: (req) => parseInt(req.params.replyId),
    getNewData: (req) => ({ content: req.body.content }),
  }),
  controller.updateReply,
);

router.patch(
  "/:id/replies/:replyId/moderation",
  hasPermission("reviews.hide"),
  validateParams(replyIdParamSchema),
  validateBody(moderateReplySchema),
  auditLog({
    action: "MODERATE_REPLY",
    tableName: "review_replies",
    getRecordId: (req) => parseInt(req.params.replyId),
    getNewData: (req) => ({ status: req.body.status }),
  }),
  controller.moderateReply,
);

router.delete(
  "/:id/replies/:replyId",
  hasPermission("reviews.reply"),
  validateParams(replyIdParamSchema),
  auditLog({
    action: "DELETE_REPLY",
    tableName: "review_replies",
    getRecordId: (req) => parseInt(req.params.replyId),
  }),
  controller.deleteReply,
);

export default router;
