import { Router } from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { requireActiveBusiness } from "../../middlewares/requireActiveBusiness.js";
import { requireBusinessOwner } from "../../middlewares/requireBusinessOwner.js";
import { validateBody, validateParams } from "../../middlewares/validateSchema.js";
import { createPayoutSchema, payoutIdParamSchema } from "../../models/schemas/business/payout.schema.js";
import * as payoutController from "../../controllers/business/payout.controller.js";

const router = Router();

router.use(authenticate);

const activeBiz = requireActiveBusiness({ requireContractSigned: true });

// GET /api/business/earnings - Earnings summary
router.get("/earnings", requireBusinessOwner, activeBiz, payoutController.getEarnings);

// GET /api/business/payouts - Payout history
router.get("/payouts", requireBusinessOwner, activeBiz, payoutController.getPayouts);

// POST /api/business/payouts - Request payout
router.post(
  "/payouts",
  requireBusinessOwner,
  activeBiz,
  validateBody(createPayoutSchema),
  payoutController.requestPayout,
);

// POST /api/business/payouts/:id/cancel - Cancel pending payout
router.post(
  "/payouts/:id/cancel",
  requireBusinessOwner,
  activeBiz,
  validateParams(payoutIdParamSchema),
  payoutController.cancelPayout,
);

export default router;
