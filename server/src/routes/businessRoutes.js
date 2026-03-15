/**
 * Business Routes - Clean Architecture
 * Tổ chức theo domain: Profile | Admin | Dashboard
 */
import express from "express";
import {
  getProfile,
  register,
  updateProfile,
  getMyPlaces,
  signContract,
} from "../controllers/business/businessProfileController.js";
import {
  getAll,
  getById,
  approve,
  reject,
  suspend,
  reactivate,
} from "../controllers/business/businessAdminController.js";
import { getDashboard } from "../controllers/business/businessDashboardController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { hasPermission } from "../middlewares/permissionMiddleware.js";
import { auditLog } from "../middlewares/auditLogMiddleware.js";
import { validateBody, validateQuery } from "../middlewares/validateSchema.js";
import { businessDocUpload } from "../middlewares/uploadMiddleware.js";
import {
  registerBusinessSchema,
  updateBusinessSchema,
  approveBusinessSchema,
  rejectBusinessSchema,
  signBusinessContractSchema,
  getBusinessesQuerySchema,
} from "../models/schemas/businessSchema.js";

const router = express.Router();

router.use(authenticate);

// ========== Profile (Business Owner) ==========
router.get("/profile", getProfile);

router.post(
  "/register",
  businessDocUpload,
  validateBody(registerBusinessSchema),
  auditLog({
    action: "CREATE",
    tableName: "businesses",
    getRecordId: (req, body) => body?.data?.id,
    getNewData: (req) => ({ businessName: req.body.businessName }),
  }),
  register,
);

router.put(
  "/profile",
  businessDocUpload,
  validateBody(updateBusinessSchema),
  auditLog({
    action: "UPDATE",
    tableName: "businesses",
    getNewData: (req) => req.body,
  }),
  updateProfile,
);

// ========== Dashboard (Business Owner) ==========
router.get("/dashboard", getDashboard);

// ========== My Places (Business Owner - for service creation) ==========
router.get("/places", getMyPlaces);

router.put(
  "/profile/contract-sign",
  validateBody(signBusinessContractSchema),
  auditLog({
    action: "SIGN_CONTRACT",
    tableName: "businesses",
    getNewData: () => ({ contractSigned: true }),
  }),
  signContract,
);

// ========== Admin (business.view, business.approve) ==========
router.get(
  "/",
  hasPermission("business.view"),
  validateQuery(getBusinessesQuerySchema),
  getAll,
);

router.get("/:id", hasPermission("business.view"), getById);

router.put(
  "/:id/approve",
  hasPermission("business.approve"),
  validateBody(approveBusinessSchema),
  auditLog({
    action: "APPROVE",
    tableName: "businesses",
    getNewData: (req) => ({ status: "approved" }),
  }),
  approve,
);

router.put(
  "/:id/reject",
  hasPermission("business.approve"),
  validateBody(rejectBusinessSchema),
  auditLog({
    action: "REJECT",
    tableName: "businesses",
    getNewData: (req) => ({
      status: "rejected",
      rejectionReason: req.body.rejectionReason,
    }),
  }),
  reject,
);

router.put(
  "/:id/suspend",
  hasPermission("business.approve"),
  auditLog({
    action: "SUSPEND",
    tableName: "businesses",
    getNewData: () => ({ status: "suspended" }),
  }),
  suspend,
);

router.put(
  "/:id/reactivate",
  hasPermission("business.approve"),
  auditLog({
    action: "REACTIVATE",
    tableName: "businesses",
    getNewData: () => ({ status: "approved" }),
  }),
  reactivate,
);

export default router;
