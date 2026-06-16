import { Router } from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import { auditLog } from "../../middlewares/auditLogMiddleware.js";
import * as payoutController from "../../controllers/business/payout.controller.js";
import { getPlatformCommissionSummary } from "../../services/booking/bookingTransaction.service.js";

const router = Router();

router.use(authenticate);

// GET /api/admin/payouts - List all payout requests
router.get(
  "/",
  hasPermission("payouts.view"),
  payoutController.adminGetAll,
);

// GET /api/admin/payouts/stats - Get payout stats for admin dashboard
router.get(
  "/stats",
  hasPermission("payouts.view"),
  payoutController.adminGetStats,
);

// GET /api/admin/payouts/commission - Platform commission summary
router.get(
  "/commission",
  hasPermission("payouts.view"),
  async (req, res, next) => {
    try {
      const summary = await getPlatformCommissionSummary(req.query);
      res.json({ success: true, data: summary, message: "OK" });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/admin/payouts/:id/approve - Approve payout
router.post(
  "/:id/approve",
  hasPermission("payouts.approve"),
  auditLog({ action: "UPDATE", tableName: "payouts", description: "Duyệt yêu cầu rút tiền" }),
  payoutController.adminApprove,
);

// POST /api/admin/payouts/:id/transfer - Mark as transferred
router.post(
  "/:id/transfer",
  hasPermission("payouts.approve"),
  auditLog({ action: "UPDATE", tableName: "payouts", description: "Xác nhận chuyển khoản" }),
  payoutController.adminTransfer,
);

// POST /api/admin/payouts/:id/reject - Reject payout
router.post(
  "/:id/reject",
  hasPermission("payouts.approve"),
  auditLog({ action: "UPDATE", tableName: "payouts", description: "Từ chối yêu cầu rút tiền" }),
  payoutController.adminReject,
);

export default router;
