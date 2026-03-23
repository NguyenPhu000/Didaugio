import express from "express";
import * as controller from "../controllers/reviewController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { validateBody, validateParams } from "../middlewares/validateSchema.js";
import {
  replyReviewSchema,
  updateReplySchema,
  reviewIdParamSchema,
  replyIdParamSchema,
} from "../models/schemas/reviewSchema.js";

const router = express.Router();

router.use(authenticate);

router.get("/", controller.getAll);
router.get("/stats", controller.getStats);
router.get("/:id", validateParams(reviewIdParamSchema), controller.getById);

router.post(
  "/:id/reply",
  validateParams(reviewIdParamSchema),
  validateBody(replyReviewSchema),
  controller.reply,
);

router.put(
  "/:id/replies/:replyId",
  validateParams(replyIdParamSchema),
  validateBody(updateReplySchema),
  controller.updateReply,
);

router.delete(
  "/:id/replies/:replyId",
  validateParams(replyIdParamSchema),
  controller.deleteReply,
);

export default router;
