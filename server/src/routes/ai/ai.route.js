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
import { aiNavigateSchema } from "../../models/index.js";

const router = express.Router();
const voiceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/place-summary", authenticate, handlePlaceSummaryStream);
router.post("/chat", authenticate, handleChat);
router.post("/groq-chat", authenticate, handleGroqChat);
router.post(
  "/voice/transcribe",
  authenticate,
  voiceUpload.single("audio"),
  handleVoiceTranscribe,
);
router.post("/voice/speech", authenticate, handleVoiceSpeech);
router.post("/hybrid-plan", authenticate, handleHybridPlan);
router.post(
  "/navigate",
  authenticate,
  validateBody(aiNavigateSchema),
  handleNavigate,
);

export default router;
