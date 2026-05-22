import express from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import dashboardController from "../../controllers/dashboard/dashboard.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/stats", hasPermission("system.view_analytics"), dashboardController.getStats);
router.get("/timeline", hasPermission("system.view_analytics"), dashboardController.getTimeline);
router.get("/health", hasPermission("system.view_analytics"), dashboardController.getHealth);

export default router;
