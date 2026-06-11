import express from "express";
import * as controller from "../../controllers/payment/payment.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";

const router = express.Router();

/* ── Public webhook endpoints (no auth) ─────────────────────────────────── */

router.get("/vnpay-ipn", controller.vnpayIpn);

router.post("/momo-ipn", controller.momoIpn);

router.get("/vnpay-return", controller.vnpayReturn);

router.get("/momo-return", controller.momoReturn);

/* ── Authenticated endpoints ────────────────────────────────────────────── */

router.use(authenticate);

router.post("/checkout", controller.checkout);

router.get("/admin", hasPermission("payments.refund"), controller.getAdminPayments);

router.get("/:id", controller.getById);

router.post(
  "/:id/refund",
  hasPermission("payments.refund"),
  controller.refund,
);

router.post(
  "/:id/reject-refund",
  hasPermission("payments.refund"),
  controller.rejectRefund,
);

export default router;
