import { Router } from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { requireActiveBusiness } from "../../middlewares/requireActiveBusiness.js";
import { validateBody, validateParams } from "../../middlewares/validateSchema.js";
import { createPayoutSchema, payoutIdParamSchema } from "../../models/schemas/business/payout.schema.js";
import * as payoutController from "../../controllers/business/payout.controller.js";

const router = Router();

router.use(authenticate);

const activeBiz = requireActiveBusiness({ requireContractSigned: true });

// GET /api/business/earnings - Earnings summary
router.get("/earnings", activeBiz, payoutController.getEarnings);

// GET /api/business/payouts - Payout history
router.get("/payouts", activeBiz, payoutController.getPayouts);

// POST /api/business/payouts - Request payout
router.post("/payouts", activeBiz, validateBody(createPayoutSchema), payoutController.requestPayout);

// POST /api/business/payouts/:id/cancel - Cancel pending payout
router.post("/payouts/:id/cancel", activeBiz, validateParams(payoutIdParamSchema), payoutController.cancelPayout);

export default router;
