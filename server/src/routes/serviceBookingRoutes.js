import express from "express";
import * as bookingController from "../controllers/bookingController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { validateBody, validateParams } from "../middlewares/validateSchema.js";
import {
  createBookingSchema,
  serviceBookingParamSchema,
} from "../models/index.js";

const router = express.Router();

router.use(authenticate);

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
