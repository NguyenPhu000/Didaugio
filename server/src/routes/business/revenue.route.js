import { Router } from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { requireActiveBusiness } from "../../middlewares/requireActiveBusiness.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import * as revenueController from "../../controllers/business/revenue.controller.js";

const router = Router();

router.use(authenticate);
router.use(requireActiveBusiness({ requireContractSigned: true }));

const revenueViewPermission = ["business.view_revenue", "business.view_detail"];

// GET /api/business/revenue/overview
router.get(
  "/overview",
  hasPermission(revenueViewPermission),
  revenueController.getOverview,
);

// GET /api/business/revenue/timeline
router.get(
  "/timeline",
  hasPermission(revenueViewPermission),
  revenueController.getTimeline,
);

// GET /api/business/revenue/by-place
router.get(
  "/by-place",
  hasPermission(revenueViewPermission),
  revenueController.getByPlace,
);

// GET /api/business/revenue/transactions
router.get(
  "/transactions",
  hasPermission(revenueViewPermission),
  revenueController.getTransactions,
);

// GET /api/business/revenue/export
router.get(
  "/export",
  hasPermission(revenueViewPermission),
  revenueController.exportCsv,
);

export default router;
