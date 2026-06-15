import express from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import {
  handlePlaceSummaryStream,
  handleChat,
  handleNavigate,
  handleGroqChat,
  handleHybridPlan,
} from "../../controllers/ai/index.js";
import { validateBody } from "../../middlewares/validateSchema.js";
import { aiNavigateSchema } from "../../models/index.js";

const router = express.Router();

router.post("/place-summary", authenticate, handlePlaceSummaryStream);
router.post("/chat", authenticate, handleChat);
router.post("/groq-chat", authenticate, handleGroqChat);
router.post("/hybrid-plan", authenticate, handleHybridPlan);
router.post(
  "/navigate",
  authenticate,
  validateBody(aiNavigateSchema),
  handleNavigate,
);

export default router;
