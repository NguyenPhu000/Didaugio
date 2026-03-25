/**
 * Business Offering Routes - Dịch vụ/sản phẩm doanh nghiệp cung cấp (CRUD)
 * Path: /api/business/services
 */
import express from "express";
import * as controller from "../controllers/businessOfferingController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { hasPermission } from "../middlewares/permissionMiddleware.js";
import { checkBusinessOwnership } from "../middlewares/businessOwnership.js";
import { requireActiveBusiness } from "../middlewares/requireActiveBusiness.js";
import { validateBody, validateQuery } from "../middlewares/validateSchema.js";
import { auditLog } from "../middlewares/auditLogMiddleware.js";
import {
  createServiceSchema,
  updateServiceSchema,
  getBusinessServicesQuerySchema,
} from "../models/index.js";

const router = express.Router();

router.use(authenticate);
router.use(requireActiveBusiness({ requireContractSigned: true }));

// Business owner: business.manage_services | Admin: business.view_detail
const serviceAccessPermission = [
  "business.manage_services",
  "business.view_detail",
];

router.get(
  "/",
  hasPermission(serviceAccessPermission),
  validateQuery(getBusinessServicesQuerySchema),
  controller.getAll,
);

router.get("/:id", hasPermission(serviceAccessPermission), controller.getById);

router.post(
  "/",
  hasPermission("business.manage_services"),
  validateBody(createServiceSchema),
  auditLog({
    action: "CREATE",
    tableName: "business_services",
    getRecordId: (req, body) => body?.data?.id,
    getNewData: (req) => ({ name: req.body.name, price: req.body.price }),
  }),
  controller.create,
);

// checkBusinessOwnership: Middleware kiểm tra dịch vụ thuộc DN đang đăng nhập
router.put(
  "/:id",
  checkBusinessOwnership("service"),
  validateBody(updateServiceSchema),
  auditLog({
    action: "UPDATE",
    tableName: "business_services",
    getNewData: (req) => req.body,
  }),
  controller.update,
);

router.delete(
  "/:id",
  checkBusinessOwnership("service"),
  auditLog({
    action: "DELETE",
    tableName: "business_services",
  }),
  controller.remove,
);

export default router;
