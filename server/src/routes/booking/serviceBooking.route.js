import express from "express";
import * as bookingController from "../../controllers/booking/booking.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import {
  validateBody,
  validateParams,
} from "../../middlewares/validateSchema.js";
import {
  createBookingSchema,
  serviceBookingParamSchema,
} from "../../models/index.js";
import { ROLES } from "../../config/constants.js";

const router = express.Router();

router.use(authenticate);

// Block GUEST from booking services
router.use((req, res, next) => {
  if (req.user?.roleId === ROLES.GUEST) {
    return res.status(403).json({
      success: false,
      data: null,
      message: "Vui long dang nhap de dat dich vu",
      errorCode: "GUEST_NOT_ALLOWED",
    });
  }
  next();
});

router.post(
  "/:serviceId/book",
  validateParams(serviceBookingParamSchema),
  (req, res, next) => {
    req.body = {
      ...(req.body || {}),
      serviceId: req.params.serviceId,
    };
    next();
  },
  validateBody(createBookingSchema),
  bookingController.create,
);

export default router;

