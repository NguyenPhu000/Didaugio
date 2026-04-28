import express from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { validateBody } from "../../middlewares/validateSchema.js";
import {
  routingCalculateSchema,
  routingLegsSchema,
} from "./routing.schemas.js";
import {
  calculateRoute,
  calculateRouteLegs,
  getRoutingHealth,
} from "./routing.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/health", getRoutingHealth);
router.post("/calculate", validateBody(routingCalculateSchema), calculateRoute);
router.post("/legs", validateBody(routingLegsSchema), calculateRouteLegs);

export default router;
