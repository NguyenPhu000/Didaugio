import express from "express";
import rateLimit from "express-rate-limit";
import {
  getAdminPlaceHeatmap,
  getBusinessPlaceHeatmap,
  trackPlaceTelemetry,
} from "../../controllers/analytics/placeTelemetry.controller.js";
import { authenticate, authenticateOptional } from "../../middlewares/authMiddleware.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";

const router = express.Router();
const telemetryLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });

router.post("/places/:placeId", authenticateOptional, telemetryLimiter, trackPlaceTelemetry);
router.get("/business/heatmap", authenticate, getBusinessPlaceHeatmap);
router.get("/admin/heatmap", authenticate, hasPermission("places.view"), getAdminPlaceHeatmap);

export default router;
