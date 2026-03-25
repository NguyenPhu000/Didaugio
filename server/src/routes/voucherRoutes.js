import express from "express";
import * as controller from "../controllers/voucherController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { checkBusinessOwnership } from "../middlewares/businessOwnership.js";
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

router.get("/", controller.getAll);

router.post(
  "/",
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
  validateBody(bulkDeactivateSchema),
  auditLog({ action: "BULK_DEACTIVATE", tableName: "vouchers" }),
  controller.bulkDeactivate,
);

router.get("/:id", controller.getById);
router.get(
  "/:id/usage",
  checkBusinessOwnership("voucher"),
  controller.getUsageStats,
);

router.put(
  "/:id",
  checkBusinessOwnership("voucher"),
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
  auditLog({ action: "DELETE", tableName: "vouchers" }),
  controller.remove,
);

export default router;
