import express from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { aiUserLimiter } from "../../middlewares/rateLimitMiddleware.js";
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

router.use(authenticate);
router.use(aiUserLimiter);

router.post(
  "/place-summary",
  validateBody(aiPlaceSummarySchema),
  handlePlaceSummaryStream,
);
router.post("/chat", validateBody(aiChatSchema), handleChat);
router.post(
  "/groq-chat",
  validateBody(aiChatSchema),
  handleGroqChat,
);
router.post(
  "/voice/transcribe",
  voiceUpload.single("audio"),
  handleVoiceTranscribe,
);
router.post(
  "/voice/speech",
  validateBody(aiSpeechSchema),
  handleVoiceSpeech,
);
router.post(
  "/hybrid-plan",
  validateBody(aiHybridPlanSchema),
  handleHybridPlan,
);
router.post(
  "/navigate",
  validateBody(aiNavigateSchema),
  handleNavigate,
);

export default router;
