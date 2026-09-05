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
import { validateAiBody } from "../../middlewares/validateSchema.js";
import {
  aiChatSchema,
  aiHybridPlanSchema,
  aiNavigateSchema,
  aiPlaceSummarySchema,
  aiSpeechSchema,
  aiTranscriptionFieldsSchema,
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
  validateAiBody(aiPlaceSummarySchema),
  handlePlaceSummaryStream,
);
router.post("/chat", validateAiBody(aiChatSchema), handleChat);
router.post(
  "/groq-chat",
  validateAiBody(aiChatSchema),
  handleGroqChat,
);
router.post(
  "/voice/transcribe",
  voiceUpload.single("audio"),
  validateAiBody(aiTranscriptionFieldsSchema),
  handleVoiceTranscribe,
);
router.post(
  "/voice/speech",
  validateAiBody(aiSpeechSchema),
  handleVoiceSpeech,
);
router.post(
  "/hybrid-plan",
  validateAiBody(aiHybridPlanSchema),
  handleHybridPlan,
);
router.post(
  "/navigate",
  validateAiBody(aiNavigateSchema),
  handleNavigate,
);

export default router;
