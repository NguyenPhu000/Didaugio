import express from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import { requireBackOfficeRole } from "../../middlewares/blockGuestFromAdmin.js";
import dashboardController from "../../controllers/dashboard/dashboard.controller.js";

const router = express.Router();

router.use(authenticate, requireBackOfficeRole);

router.get("/stats", hasPermission("system.view_analytics"), dashboardController.getStats);
router.get("/timeline", hasPermission("system.view_analytics"), dashboardController.getTimeline);
router.get("/health", hasPermission("system.view_analytics"), dashboardController.getHealth);
router.get("/online-users", hasPermission("system.view_analytics"), dashboardController.getOnlineUsers);

export default router;
