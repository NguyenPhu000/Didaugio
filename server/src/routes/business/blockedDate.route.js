import { Router } from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { requireActiveBusiness } from "../../middlewares/requireActiveBusiness.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import { auditLog } from "../../middlewares/auditLogMiddleware.js";
import { validateBody, validateQuery } from "../../middlewares/validateSchema.js";
import * as controller from "../../controllers/business/blockedDate.controller.js";
import {
  createBlockedDateSchema,
  blockedDateQuerySchema,
} from "../../models/index.js";

const router = Router();

router.use(authenticate);
router.use(requireActiveBusiness());

router.get(
  "/",
  hasPermission("staff.view"),
  validateQuery(blockedDateQuerySchema),
  controller.getAll,
);

router.post(
  "/",
  hasPermission("staff.create"),
  validateBody(createBlockedDateSchema),
  auditLog({
    action: "CREATE",
    tableName: "business_blocked_dates",
    description: "Chặn ngày đặt chỗ",
  }),
  controller.create,
);

router.delete(
  "/:id",
  hasPermission("staff.create"),
  auditLog({
    action: "DELETE",
    tableName: "business_blocked_dates",
    description: "Bỏ chặn ngày đặt chỗ",
  }),
  controller.remove,
);

export default router;
