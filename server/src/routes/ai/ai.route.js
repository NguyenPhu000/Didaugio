import express from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/authMiddleware.js";
import {
  handlePlaceSummaryStream,
  handleChat,
  handleVoiceSpeech,
  handleVoiceTranscribe,
  handleNavigate,
  handleGroqChat,
  handleHybridPlan,
} from "../../controllers/ai/index.js";
import { validateBody } from "../../middlewares/validateSchema.js";
import {
  aiChatSchema,
  aiHybridPlanSchema,
  aiNavigateSchema,
  aiPlaceSummarySchema,
  aiSpeechSchema,
} from "../../models/index.js";

const router = express.Router();
const voiceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post(
  "/place-summary",
  authenticate,
  validateBody(aiPlaceSummarySchema),
  handlePlaceSummaryStream,
);
router.post("/chat", authenticate, validateBody(aiChatSchema), handleChat);
router.post(
  "/groq-chat",
  authenticate,
  validateBody(aiChatSchema),
  handleGroqChat,
);
router.post(
  "/voice/transcribe",
  authenticate,
  voiceUpload.single("audio"),
  handleVoiceTranscribe,
);
router.post(
  "/voice/speech",
  authenticate,
  validateBody(aiSpeechSchema),
  handleVoiceSpeech,
);
router.post(
  "/hybrid-plan",
  authenticate,
  validateBody(aiHybridPlanSchema),
  handleHybridPlan,
);
router.post(
  "/navigate",
  authenticate,
  validateBody(aiNavigateSchema),
  handleNavigate,
);

export default router;
