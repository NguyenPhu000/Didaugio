import express from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import { requireBackOfficeRole } from "../../middlewares/blockGuestFromAdmin.js";
import * as settingsController from "../../controllers/settings/settings.controller.js";

const router = express.Router();

router.use(authenticate, requireBackOfficeRole);

router.get("/", hasPermission("system.view_config"), settingsController.getSettings);
router.put("/", hasPermission("system.edit_config"), settingsController.updateSettings);

export default router;
