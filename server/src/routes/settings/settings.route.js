import express from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import { requireBackOfficeRole } from "../../middlewares/blockGuestFromAdmin.js";
import * as settingsController from "../../controllers/settings/settings.controller.js";

const router = express.Router();

router.use(authenticate, requireBackOfficeRole);

// Cấu hình nghiệp vụ & vận hành
router.get("/", hasPermission("system.view_config"), settingsController.getSettings);
router.put("/", hasPermission("system.edit_config"), settingsController.updateSettings);

// Giám sát sức khỏe & Nhật ký hệ thống
router.get("/logs", hasPermission("system.view_config"), settingsController.getSystemLogs);
router.get("/health", hasPermission("system.view_config"), settingsController.getSystemHealth);

export default router;
