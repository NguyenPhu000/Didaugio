import express from "express";
import * as controller from "../controllers/voucherController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { checkBusinessOwnership } from "../middlewares/businessOwnership.js";
import { hasPermission } from "../middlewares/permissionMiddleware.js";
import { requireActiveBusiness } from "../middlewares/requireActiveBusiness.js";
import { validateBody } from "../middlewares/validateSchema.js";
import { auditLog } from "../middlewares/auditLogMiddleware.js";
import {
  createVoucherSchema,
  updateVoucherSchema,
  bulkDeactivateSchema,
} from "../models/index.js";

const router = express.Router();

router.use(authenticate);
router.use(requireActiveBusiness({ requireContractSigned: true }));

// Business owner: business.manage_vouchers | Admin: business.view_detail
const voucherViewPermission = ["business.manage_vouchers", "business.view_detail"];

router.get("/", hasPermission(voucherViewPermission), controller.getAll);

router.post(
  "/",
  hasPermission("business.manage_vouchers"),
  validateBody(createVoucherSchema),
  auditLog({
    action: "CREATE",
    tableName: "vouchers",
    getRecordId: (req, body) => body?.data?.id,
    getNewData: (req) => ({ code: req.body.code }),
  }),
  controller.create,
);

router.post(
  "/bulk-deactivate",
  hasPermission("business.manage_vouchers"),
  validateBody(bulkDeactivateSchema),
  auditLog({ action: "BULK_DEACTIVATE", tableName: "vouchers" }),
  controller.bulkDeactivate,
);

router.get(
  "/:id",
  hasPermission(voucherViewPermission),
  checkBusinessOwnership("voucher"),
  controller.getById,
);
router.get(
  "/:id/usage",
  hasPermission(voucherViewPermission),
  checkBusinessOwnership("voucher"),
  controller.getUsageStats,
);

router.put(
  "/:id",
  checkBusinessOwnership("voucher"),
  hasPermission("business.manage_vouchers"),
  validateBody(updateVoucherSchema),
  auditLog({
    action: "UPDATE",
    tableName: "vouchers",
    getNewData: (req) => req.body,
  }),
  controller.update,
);

router.delete(
  "/:id",
  checkBusinessOwnership("voucher"),
  hasPermission("business.manage_vouchers"),
  auditLog({ action: "DELETE", tableName: "vouchers" }),
  controller.remove,
);

export default router;
