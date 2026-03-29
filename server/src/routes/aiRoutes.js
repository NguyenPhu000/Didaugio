import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { handlePlaceSummaryStream, handleChat } from "../controllers/aiController.js";

const router = express.Router();

router.post("/place-summary", authenticate, handlePlaceSummaryStream);
router.post("/chat", authenticate, handleChat);

export default router;
