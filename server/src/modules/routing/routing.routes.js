import express from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { validateBody } from "../../middlewares/validateSchema.js";
import {
  routingCalculateSchema,
  routingLegsSchema,
  routingTableSchema,
} from "./routing.schemas.js";
import {
  calculateRoute,
  calculateRouteLegs,
  calculateTable,
  getRoutingHealth,
} from "./routing.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/health", getRoutingHealth);
router.post("/calculate", validateBody(routingCalculateSchema), calculateRoute);
router.post("/legs", validateBody(routingLegsSchema), calculateRouteLegs);
router.post("/table", validateBody(routingTableSchema), calculateTable);

export default router;
