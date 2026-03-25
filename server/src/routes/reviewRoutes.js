import express from "express";
import * as controller from "../controllers/reviewController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { requireActiveBusiness } from "../middlewares/requireActiveBusiness.js";
import { auditLog } from "../middlewares/auditLogMiddleware.js";
import { validateBody, validateParams } from "../middlewares/validateSchema.js";
import {
  replyReviewSchema,
  updateReplySchema,
  moderateReplySchema,
  reviewIdParamSchema,
  replyIdParamSchema,
} from "../models/index.js";

const router = express.Router();

router.use(authenticate);
router.use(requireActiveBusiness({ requireContractSigned: true }));

router.get("/", controller.getAll);
router.get("/stats", controller.getStats);
router.get("/:id", validateParams(reviewIdParamSchema), controller.getById);

router.post(
  "/:id/reply",
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
  validateParams(replyIdParamSchema),
  auditLog({
    action: "DELETE_REPLY",
    tableName: "review_replies",
    getRecordId: (req) => parseInt(req.params.replyId),
  }),
  controller.deleteReply,
);

export default router;
