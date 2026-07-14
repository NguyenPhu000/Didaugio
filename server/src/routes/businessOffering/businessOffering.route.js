/**
 * Business Offering Routes - Dịch vụ/sản phẩm doanh nghiệp cung cấp (CRUD)
 * Path: /api/business/services
 */
import express from "express";
import * as controller from "../../controllers/businessOffering/businessOffering.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import { checkBusinessOwnership } from "../../middlewares/businessOwnership.js";
import { requireActiveBusiness } from "../../middlewares/requireActiveBusiness.js";
import { requireActiveSubscription } from "../../middlewares/subscriptionFeatureLock.js";
import {
  validateBody,
  validateQuery,
} from "../../middlewares/validateSchema.js";
import { auditLog } from "../../middlewares/auditLogMiddleware.js";
import {
  createServiceSchema,
  updateServiceSchema,
  updateServiceDepositConfigSchema,
  getBusinessServicesQuerySchema,
} from "../../models/index.js";

const router = express.Router();

router.use(authenticate);

// Business owner: business.manage_services | Admin: business.view_detail
const serviceAccessPermission = [
  "business.manage_services",
  "business.view_detail",
];

// Read and create operations: only require approved business (draft allowed before contract)
router.get("/", hasPermission(serviceAccessPermission), validateQuery(getBusinessServicesQuerySchema), controller.getAll);
router.get("/:id", hasPermission(serviceAccessPermission), checkBusinessOwnership("service"), controller.getById);
router.post("/", requireActiveBusiness(), requireActiveSubscription, hasPermission("business.manage_services"), validateBody(createServiceSchema), auditLog({ action: "CREATE", tableName: "business_services", getRecordId: (req, body) => body?.data?.id, getNewData: (req) => ({ name: req.body.name, price: req.body.price }) }), controller.create);

// Operational routes: require contract signed
router.use(requireActiveBusiness({ requireContractSigned: true }));
router.use(requireActiveSubscription);

// checkBusinessOwnership + manage_services: đồng bộ RBAC với POST tạo dịch vụ
router.put(
  "/:id",
  checkBusinessOwnership("service"),
  hasPermission("business.manage_services"),
  validateBody(updateServiceSchema),
  auditLog({
    action: "UPDATE",
    tableName: "business_services",
    getNewData: (req) => req.body,
  }),
  controller.update,
);

router.patch(
  "/:id/deposit-config",
  checkBusinessOwnership("service"),
  hasPermission("business.manage_services"),
  validateBody(updateServiceDepositConfigSchema),
  auditLog({
    action: "UPDATE_DEPOSIT_CONFIG",
    tableName: "business_services",
    getNewData: (req) => ({
      requireDeposit: req.body.requireDeposit,
      depositType: req.body.depositType,
      depositAmount: req.body.depositAmount,
      depositRefundable: req.body.depositRefundable,
      depositRefundPercent: req.body.depositRefundPercent,
    }),
  }),
  controller.updateDepositConfig,
);

router.delete(
  "/:id",
  checkBusinessOwnership("service"),
  hasPermission("business.manage_services"),
  auditLog({
    action: "DELETE",
    tableName: "business_services",
  }),
  controller.remove,
);

export default router;
