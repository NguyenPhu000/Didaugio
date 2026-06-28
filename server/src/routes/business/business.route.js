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
  downloadContract,
  decryptProfile,
  sendContractOtp,
} from "../../controllers/business/businessProfile.controller.js";
import {
  getAll,
  getById,
  approve,
  reject,
  suspend,
  reactivate,
  terminate,
} from "../../controllers/business/businessAdmin.controller.js";
import { getDashboard } from "../../controllers/business/businessDashboard.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import { auditLog } from "../../middlewares/auditLogMiddleware.js";
import {
  validateBody,
  validateQuery,
} from "../../middlewares/validateSchema.js";
import { businessDocUpload } from "../../middlewares/uploadMiddleware.js";
import { requireActiveBusiness } from "../../middlewares/requireActiveBusiness.js";
import { sanitizeBody } from "../../middlewares/sanitizeMiddleware.js";
import {
  registerBusinessSchema,
  updateBusinessSchema,
  approveBusinessSchema,
  rejectBusinessSchema,
  suspendBusinessSchema,
  terminateBusinessSchema,
  signBusinessContractSchema,
  getBusinessesQuerySchema,
} from "../../models/index.js";
import { ROLES } from "../../config/constants.js";

const router = express.Router();

router.use(authenticate);

// Block GUEST from all business routes
router.use((req, res, next) => {
  if (req.user?.roleId === ROLES.GUEST) {
    return res.status(403).json({
      success: false,
      data: null,
      message: "Tai khoan Guest khong the truy cap chuc nang doanh nghiep",
      errorCode: "GUEST_NOT_ALLOWED",
    });
  }
  next();
});

// ========== Profile (Business Owner) ==========
router.get("/profile", getProfile);
router.post("/profile/decrypt", decryptProfile);

router.post(
  "/register",
  businessDocUpload,
  sanitizeBody(["businessName", "fullName", "address", "taxCode"]),
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
  sanitizeBody(["businessName", "fullName", "address", "taxCode"]),
  validateBody(updateBusinessSchema),
  auditLog({
    action: "UPDATE",
    tableName: "businesses",
    getNewData: (req) => req.body,
  }),
  updateProfile,
);

// ========== Dashboard (Business Owner) ==========
router.get("/dashboard", requireActiveBusiness(), getDashboard);

// ========== My Places (Business Owner - for service creation) ==========
router.get("/places", requireActiveBusiness(), getMyPlaces);

router.post(
  "/profile/contract-otp",
  sendContractOtp
);

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

// Download contract PDF (business owner or admin)
router.get("/:id/contract", downloadContract);

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
  sanitizeBody(["rejectionReason"]),
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
  sanitizeBody(["suspensionReason"]),
  validateBody(suspendBusinessSchema),
  auditLog({
    action: "SUSPEND",
    tableName: "businesses",
    getNewData: (req) => ({
      status: "suspended",
      suspensionReason: req.body.suspensionReason,
    }),
  }),
  suspend,
);

router.put(
  "/:id/reactivate",
  hasPermission("business.approve"),
  auditLog({
    action: "REACTIVATE",
    tableName: "businesses",
    getNewData: () => ({ status: "approved", suspensionReason: null }),
  }),
  reactivate,
);

router.put(
  "/:id/terminate",
  hasPermission("business.approve"),
  sanitizeBody(["terminationReason"]),
  validateBody(terminateBusinessSchema),
  auditLog({
    action: "TERMINATE",
    tableName: "businesses",
    getNewData: (req) => ({
      status: "terminated",
      terminationReason: req.body.terminationReason,
    }),
  }),
  terminate,
);

export default router;
