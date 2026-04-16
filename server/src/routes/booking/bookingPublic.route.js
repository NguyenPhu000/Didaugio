import express from "express";
import * as bookingController from "../../controllers/booking/booking.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { checkBusinessOwnershipByBookingCode } from "../../middlewares/businessOwnership.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import { requireActiveBusiness } from "../../middlewares/requireActiveBusiness.js";
import { validateBody } from "../../middlewares/validateSchema.js";
import { verifyQRSchema } from "../../models/index.js";

const router = express.Router();

router.use(authenticate);
router.use(requireActiveBusiness({ requireContractSigned: true }));

// Keep backward compatibility by allowing bookings.complete while introducing bookings.checkin.
router.post(
  "/verify",
  validateBody(verifyQRSchema),
  hasPermission(["bookings.checkin", "bookings.complete"]),
  checkBusinessOwnershipByBookingCode,
  bookingController.verifyQR,
);

export default router;
