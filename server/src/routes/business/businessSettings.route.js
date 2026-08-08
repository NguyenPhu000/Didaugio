import { Router } from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { requireActiveBusiness } from "../../middlewares/requireActiveBusiness.js";
import { requireBusinessOwner } from "../../middlewares/requireBusinessOwner.js";
import { validateBody } from "../../middlewares/validateSchema.js";
import { auditLog } from "../../middlewares/auditLogMiddleware.js";
import * as controller from "../../controllers/business/businessSettings.controller.js";
import { updateBusinessSettingsSchema } from "../../models/index.js";

const router = Router();

router.use(authenticate);
router.use(requireBusinessOwner);
router.use(requireActiveBusiness());

router.get("/", controller.getSettings);

router.put(
  "/",
  validateBody(updateBusinessSettingsSchema),
  auditLog({
    action: "UPDATE",
    tableName: "businesses",
    description: "Cập nhật cài đặt doanh nghiệp",
  }),
  controller.updateSettings,
);

export default router;
