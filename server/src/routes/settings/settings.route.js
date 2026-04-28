import express from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import {
  blockGuestFromAdmin,
  checkMinRole,
} from "../../middlewares/blockGuestFromAdmin.js";
import * as settingsController from "../../controllers/settings/settings.controller.js";

const router = express.Router();

router.use(authenticate, blockGuestFromAdmin);

/** Chỉ Super Admin & Admin (không dùng permission settings.* để tránh 403 khi chưa gán quyền trong DB) */
const onlySettingsAdmins = checkMinRole(["SUPER_ADMIN", "ADMIN"]);

router.get("/", onlySettingsAdmins, settingsController.getSettings);
router.put("/", onlySettingsAdmins, settingsController.updateSettings);

export default router;
