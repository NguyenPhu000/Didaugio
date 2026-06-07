import { Router } from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { requireActiveBusiness } from "../../middlewares/requireActiveBusiness.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import * as payoutController from "../../controllers/business/payout.controller.js";

const router = Router();

router.use(authenticate);
router.use(requireActiveBusiness({ requireContractSigned: true }));

// GET /api/business/earnings - Earnings summary
router.get("/earnings", payoutController.getEarnings);

// GET /api/business/payouts - Payout history
router.get("/payouts", payoutController.getPayouts);

// POST /api/business/payouts - Request payout
router.post("/payouts", payoutController.requestPayout);

export default router;
