import express from "express";
import * as controller from "../../controllers/payment/payment.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import { validateBody } from "../../middlewares/validateSchema.js";
import { refundPaymentSchema } from "../../models/schemas/payment/payment.schema.js";

const router = express.Router();

/* ── Public webhook endpoints (no auth) ─────────────────────────────────── */

router.get("/vnpay-ipn", controller.vnpayIpn);

router.post("/momo-ipn", controller.momoIpn);

router.get("/vnpay-return", controller.vnpayReturn);

router.get("/momo-return", controller.momoReturn);

router.post("/sepay-ipn", controller.sepayIpn);

router.get("/sepay-return", controller.sepayReturn);

router.get("/sepay-checkout-form/:paymentId", controller.sepayCheckoutForm);

router.post("/sepay-webhook", controller.sepayBankWebhook);

router.post("/sepay-webhook-refund", controller.sepayRefundWebhook);

/* ── Authenticated endpoints ────────────────────────────────────────────── */

router.use(authenticate);

router.post("/checkout", controller.checkout);

router.get(
  "/admin/cashflow/summary",
  hasPermission("payments.view_revenue"),
  controller.getAdminCashflowSummary,
);

router.get(
  "/admin/cashflow",
  hasPermission("payments.view_revenue"),
  controller.getAdminCashflow,
);

router.get("/admin", hasPermission("payments.refund"), controller.getAdminPayments);

router.get("/:id", controller.getById);

router.post(
  "/:id/refund",
  hasPermission("payments.refund"),
  validateBody(refundPaymentSchema),
  controller.refund,
);

router.post(
  "/:id/reject-refund",
  hasPermission("payments.refund"),
  controller.rejectRefund,
);

export default router;
