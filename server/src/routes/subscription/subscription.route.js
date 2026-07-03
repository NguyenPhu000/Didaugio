import express from "express";
import * as controller from "../../controllers/subscription/subscription.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { requireActiveBusiness } from "../../middlewares/requireActiveBusiness.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import { validateBody, validateQuery } from "../../middlewares/validateSchema.js";
import { auditLog } from "../../middlewares/auditLogMiddleware.js";
import {
  downgradeSchema,
  upgradeSchema,
  createPlanSchema,
  updatePlanSchema,
  invoiceQuerySchema,
  adminSubQuerySchema,
  adminUpdateStatusSchema,
} from "../../models/schemas/subscription/subscription.schema.js";

const subscriptionViewPermission = ["subscriptions.view", "subscriptions.manage"];

/** Lightweight check — requires req.activeBusiness to be set first */
function requireContractSigned(req, res, next) {
  const biz = req.activeBusiness;
  if (!biz?.contractSigned) {
    return res.status(403).json({
      success: false,
      data: null,
      message: "Vui lòng ký hợp đồng trước khi sử dụng tính năng này",
      errorCode: "CONTRACT_REQUIRED",
    });
  }
  next();
}

// ─── Business Routes ─────────────────────────────────────────────────────────
const businessRouter = express.Router();

businessRouter.post(
  "/webhook/sepay",
  controller.sepayWebhook,
);

businessRouter.use(authenticate);
businessRouter.use(requireActiveBusiness());

// Read-only endpoints — no contract required
businessRouter.get(
  "/current",
  hasPermission(subscriptionViewPermission),
  controller.getCurrentSubscription,
);
businessRouter.get(
  "/plans",
  hasPermission(subscriptionViewPermission),
  controller.getPlans,
);
businessRouter.get(
  "/proration",
  hasPermission(subscriptionViewPermission),
  validateQuery(upgradeSchema),
  controller.getProration,
);
businessRouter.get(
  "/invoices",
  hasPermission(subscriptionViewPermission),
  validateQuery(invoiceQuerySchema),
  controller.getInvoices,
);

// Write endpoint — contract required
businessRouter.post(
  "/upgrade",
  requireContractSigned,
  hasPermission(subscriptionViewPermission),
  validateBody(upgradeSchema),
  auditLog({ action: "UPDATE", tableName: "subscriptions" }),
  controller.upgrade,
);

businessRouter.post(
  "/downgrade",
  requireContractSigned,
  hasPermission(subscriptionViewPermission),
  validateBody(downgradeSchema),
  auditLog({ action: "UPDATE", tableName: "subscriptions" }),
  controller.downgrade,
);

businessRouter.post(
  "/downgrade/cancel",
  requireContractSigned,
  hasPermission(subscriptionViewPermission),
  auditLog({ action: "UPDATE", tableName: "subscriptions" }),
  controller.cancelScheduledDowngrade,
);

businessRouter.post(
  "/cancel",
  hasPermission(subscriptionViewPermission),
  auditLog({ action: "CANCEL", tableName: "subscriptions" }),
  controller.cancelSubscription,
);

businessRouter.post(
  "/invoices/:invoiceId/pay-from-wallet",
  requireContractSigned,
  hasPermission(subscriptionViewPermission),
  auditLog({ action: "PAY", tableName: "subscription_invoices" }),
  controller.payInvoiceFromWallet,
);

// ─── Admin Routes ────────────────────────────────────────────────────────────
const adminRouter = express.Router();

adminRouter.use(authenticate);
adminRouter.use(hasPermission("subscriptions.manage"));

adminRouter.get(
  "/",
  validateQuery(adminSubQuerySchema),
  controller.adminGetSubscriptions,
);

adminRouter.get("/stats", controller.adminGetStats);

adminRouter.get("/plans", controller.adminGetPlans);

adminRouter.post(
  "/plans",
  validateBody(createPlanSchema),
  auditLog({ action: "CREATE", tableName: "subscription_plans" }),
  controller.adminCreatePlan,
);

adminRouter.put(
  "/plans/:id",
  validateBody(updatePlanSchema),
  auditLog({ action: "UPDATE", tableName: "subscription_plans" }),
  controller.adminUpdatePlan,
);

adminRouter.patch(
  "/:id/status",
  validateBody(adminUpdateStatusSchema),
  auditLog({ action: "UPDATE_STATUS", tableName: "subscriptions" }),
  controller.adminUpdateStatus,
);

export { businessRouter, adminRouter };
export default businessRouter;
