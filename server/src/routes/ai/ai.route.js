import express from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import {
  handlePlaceSummaryStream,
  handleChat,
} from "../../controllers/ai/ai.controller.js";
import { handleNavigate } from "../../controllers/ai/aiNavigation.controller.js";
import { handleGroqChat } from "../../controllers/ai/groqChat.controller.js";
import { validateBody } from "../../middlewares/validateSchema.js";
import { aiNavigateSchema } from "../../models/index.js";

const router = express.Router();

router.post("/place-summary", authenticate, handlePlaceSummaryStream);
router.post("/chat", authenticate, handleChat);
router.post("/groq-chat", authenticate, handleGroqChat);
router.post(
  "/navigate",
  authenticate,
  validateBody(aiNavigateSchema),
  handleNavigate,
);

export default router;
