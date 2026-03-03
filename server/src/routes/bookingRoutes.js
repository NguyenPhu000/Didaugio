import express from "express";
import * as controller from "../controllers/bookingController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { checkBusinessOwnership } from "../middlewares/businessOwnership.js";
import { hasPermission } from "../middlewares/permissionMiddleware.js";
import { validateBody } from "../middlewares/validateSchema.js";
import { auditLog } from "../middlewares/auditLogMiddleware.js";
import {
  confirmBookingSchema,
  cancelBookingSchema,
  bulkBookingSchema,
} from "../models/schemas/bookingSchema.js";

const router = express.Router();

router.use(authenticate);

router.get("/", hasPermission("bookings.view"), controller.getAll);
router.get("/stats", hasPermission("bookings.view"), controller.getStats);

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
    getNewData: (req) => ({ status: "cancelled", cancelReason: req.body.cancelReason }),
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
  auditLog({
    action: "NO_SHOW",
    tableName: "bookings",
    getNewData: () => ({ status: "no_show" }),
  }),
  controller.markNoShow,
);

export default router;
