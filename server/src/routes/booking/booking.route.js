import express from "express";
import * as controller from "../../controllers/booking/booking.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { checkBusinessOwnership } from "../../middlewares/businessOwnership.js";
import { requireActiveBusiness } from "../../middlewares/requireActiveBusiness.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import { validateBody } from "../../middlewares/validateSchema.js";
import { auditLog } from "../../middlewares/auditLogMiddleware.js";
import {
  createBookingSchema,
  confirmBookingSchema,
  cancelBookingSchema,
  bulkBookingSchema,
  markPaidSchema,
  refundBookingSchema,
  rescheduleBookingSchema,
  quickRejectSchema,
} from "../../models/index.js";
import { ROLES } from "../../config/constants.js";

const router = express.Router();

router.use(authenticate);

// User creates booking request; GUEST cannot create bookings
router.post(
  "/",
  (req, res, next) => {
    if (req.user?.roleId === ROLES.GUEST) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Vui long dang nhap de dat cho",
        errorCode: "GUEST_NOT_ALLOWED",
      });
    }
    next();
  },
  validateBody(createBookingSchema),
  controller.create,
);

router.use(requireActiveBusiness({ requireContractSigned: true }));

router.get("/", hasPermission("bookings.view"), controller.getAll);
router.get("/stats", hasPermission("bookings.view"), controller.getStats);
router.get("/schedule", hasPermission("bookings.view"), controller.getSchedule);

router.post(
  "/bulk-confirm",
  hasPermission("bookings.confirm"),
  validateBody(bulkBookingSchema),
  auditLog({ action: "BULK_CONFIRM", tableName: "bookings" }),
  controller.bulkConfirm,
);

router.post(
  "/bulk-cancel",
  hasPermission("bookings.cancel"),
  validateBody(bulkBookingSchema),
  auditLog({ action: "BULK_CANCEL", tableName: "bookings" }),
  controller.bulkCancel,
);

router.patch(
  "/:id/reschedule",
  checkBusinessOwnership("booking"),
  hasPermission("bookings.confirm"),
  validateBody(rescheduleBookingSchema),
  controller.reschedule,
);

router.post(
  "/:id/quick-approve",
  checkBusinessOwnership("booking"),
  hasPermission("bookings.confirm"),
  controller.quickApprove,
);

router.post(
  "/:id/quick-reject",
  checkBusinessOwnership("booking"),
  hasPermission("bookings.cancel"),
  validateBody(quickRejectSchema),
  controller.quickReject,
);

router.get("/:id", checkBusinessOwnership("booking"), controller.getById);
router.get("/:id/qr", checkBusinessOwnership("booking"), controller.getQR);

router.put(
  "/:id/confirm",
  checkBusinessOwnership("booking"),
  hasPermission("bookings.confirm"),
  validateBody(confirmBookingSchema),
  auditLog({
    action: "CONFIRM",
    tableName: "bookings",
    getNewData: () => ({ status: "confirmed" }),
  }),
  controller.confirm,
);

router.put(
  "/:id/cancel",
  checkBusinessOwnership("booking"),
  hasPermission("bookings.cancel"),
  validateBody(cancelBookingSchema),
  auditLog({
    action: "CANCEL",
    tableName: "bookings",
    getNewData: (req) => ({
      status: "cancelled",
      cancelReason: req.body.cancelReason,
    }),
  }),
  controller.cancel,
);

router.put(
  "/:id/complete",
  checkBusinessOwnership("booking"),
  hasPermission("bookings.complete"),
  auditLog({
    action: "COMPLETE",
    tableName: "bookings",
    getNewData: () => ({ status: "completed" }),
  }),
  controller.complete,
);

router.put(
  "/:id/no-show",
  checkBusinessOwnership("booking"),
  hasPermission("bookings.complete"),
  auditLog({
    action: "NO_SHOW",
    tableName: "bookings",
    getNewData: () => ({ status: "no_show" }),
  }),
  controller.markNoShow,
);

router.put(
  "/:id/payment",
  checkBusinessOwnership("booking"),
  hasPermission("bookings.complete"),
  validateBody(markPaidSchema),
  auditLog({
    action: "MARK_PAID",
    tableName: "bookings",
    getNewData: (req) => ({
      paymentStatus: "paid",
      paidAt: req.body.paidAt || new Date().toISOString(),
      paymentMethod: req.body.paymentMethod || "manual",
    }),
  }),
  controller.markPaid,
);

router.put(
  "/:id/refund",
  checkBusinessOwnership("booking"),
  hasPermission("bookings.cancel"),
  validateBody(refundBookingSchema),
  auditLog({
    action: "REFUND",
    tableName: "bookings",
    getNewData: (req) => ({
      paymentStatus: "refund",
      refundAmount: req.body.refundAmount,
      refundReason: req.body.refundReason,
    }),
  }),
  controller.refund,
);

export default router;
