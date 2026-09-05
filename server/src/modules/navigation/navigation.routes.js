import express from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { aiUserLimiter } from "../../middlewares/rateLimitMiddleware.js";
import {
  validateAiBody,
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validateSchema.js";
import {
  navigationAdviceSchema,
  navigationTelemetryBatchSchema,
  navigationTelemetrySessionParamsSchema,
  navigationTelemetrySessionQuerySchema,
  navigationTelemetrySummaryQuerySchema,
} from "./navigation.schemas.js";
import {
  getNavigationTelemetryHealth,
  getNavigationTelemetrySession,
  getNavigationTelemetrySummary,
  handleNavigationRecommendation,
  ingestNavigationTelemetry,
} from "./navigation.controller.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/navigate",
  aiUserLimiter,
  validateAiBody(navigationAdviceSchema),
  handleNavigationRecommendation,
);
router.post(
  "/telemetry",
  validateBody(navigationTelemetryBatchSchema),
  ingestNavigationTelemetry,
);
router.get("/telemetry/health", getNavigationTelemetryHealth);
router.get(
  "/telemetry/summary",
  validateQuery(navigationTelemetrySummaryQuerySchema),
  getNavigationTelemetrySummary,
);
router.get(
  "/telemetry/sessions/:sessionId",
  validateParams(navigationTelemetrySessionParamsSchema),
  validateQuery(navigationTelemetrySessionQuerySchema),
  getNavigationTelemetrySession,
);

export default router;
