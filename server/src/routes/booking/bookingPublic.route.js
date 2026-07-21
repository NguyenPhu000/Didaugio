import express from "express";
import * as bookingController from "../../controllers/booking/booking.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { checkBusinessOwnershipByBookingCode } from "../../middlewares/businessOwnership.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import { requireActiveBusiness } from "../../middlewares/requireActiveBusiness.js";
import { validateBody } from "../../middlewares/validateSchema.js";
import { verifyQRSchema } from "../../models/index.js";
import { getAvailableSlots } from "../../services/booking/bookingAvailability.service.js";
import { ROLES } from "../../config/constants.js";
import { combineUseDateAndTime } from "../../utils/bookingTimeSlot.js";

const router = express.Router();

// ─── Public availability check (no auth - for mobile app) ────────────────────

/**
 * GET /api/bookings/public/availability/:serviceId
 * Public endpoint - no auth required.
 * Returns available slots for a service on a given date.
 * Used by mobile app to show real-time availability before booking.
 */
router.get(
  "/availability/:serviceId",
  async (req, res, next) => {
    try {
      const { serviceId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          data: null,
          message: "Thiếu tham số date (YYYY-MM-DD)",
          errorCode: "MISSING_PARAMS",
        });
      }

      const normalizedServiceId = Number(serviceId);
      if (!Number.isInteger(normalizedServiceId) || normalizedServiceId <= 0) {
        return res.status(400).json({
          success: false,
          data: null,
          message: "serviceId không hợp lệ",
          errorCode: "INVALID_PARAMS",
        });
      }

      try {
        combineUseDateAndTime(date, "00:00");
      } catch {
        return res.status(400).json({
          success: false,
          data: null,
          message: "Định dạng date không hợp lệ (YYYY-MM-DD)",
          errorCode: "INVALID_PARAMS",
        });
      }

      const result = await getAvailableSlots(normalizedServiceId, date);
      res.json({
        success: true,
        data: result,
        message: "Lấy thông tin slot thành công",
      });
    } catch (error) {
      next(error);
    }
  },
);

// ─── Authenticated booking operations ──────────────────────────────────────

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
