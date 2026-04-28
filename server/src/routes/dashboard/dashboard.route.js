import express from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { blockGuestFromAdmin } from "../../middlewares/blockGuestFromAdmin.js";
import dashboardController from "../../controllers/dashboard/dashboard.controller.js";

const router = express.Router();

router.get("/stats", authenticate, blockGuestFromAdmin, dashboardController.getStats);
router.get("/timeline", authenticate, blockGuestFromAdmin, dashboardController.getTimeline);
router.get("/health", authenticate, blockGuestFromAdmin, dashboardController.getHealth);

export default router;
