import express from "express";
import * as businessController from "../controllers/businessController.js";
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
  getBusinessesQuerySchema,
} from "../models/schemas/businessSchema.js";

const router = express.Router();

router.use(authenticate);

router.get("/profile", businessController.getProfile);

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
  businessController.register,
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
  businessController.updateProfile,
);

router.get("/dashboard", businessController.getDashboard);

router.get(
  "/",
  hasPermission("business.view"),
  validateQuery(getBusinessesQuerySchema),
  businessController.getAll,
);

router.get("/:id", hasPermission("business.view"), businessController.getById);

router.put(
  "/:id/approve",
  hasPermission("business.approve"),
  validateBody(approveBusinessSchema),
  auditLog({
    action: "APPROVE",
    tableName: "businesses",
    getNewData: (req) => ({ status: "approved" }),
  }),
  businessController.approve,
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
  businessController.reject,
);

export default router;
