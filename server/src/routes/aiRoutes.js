import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import {
  handlePlaceSummaryStream,
  handleChat,
} from "../controllers/aiController.js";
import { handleNavigate } from "../controllers/aiNavigationController.js";
import { validateBody } from "../middlewares/validateSchema.js";
import { aiNavigateSchema } from "../models/index.js";

const router = express.Router();

router.post("/place-summary", authenticate, handlePlaceSummaryStream);
router.post("/chat", authenticate, handleChat);
router.post(
  "/navigate",
  authenticate,
  validateBody(aiNavigateSchema),
  handleNavigate,
);

export default router;
