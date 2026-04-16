import express from "express";
import feedbackController from "../../controllers/feedback/feedback.controller.js";
import { authenticateOptional } from "../../middlewares/authMiddleware.js";
import { validateBody } from "../../middlewares/validateSchema.js";
import { submitFeedbackSchema } from "../../models/index.js";

const router = express.Router();

router.post(
  "/",
  authenticateOptional,
  validateBody(submitFeedbackSchema),
  feedbackController.submitFeedback,
);

export default router;
