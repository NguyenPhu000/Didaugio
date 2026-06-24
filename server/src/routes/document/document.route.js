/**
 * Document Routes — Tài liệu nhạy cảm (CCCD, giấy phép kinh doanh)
 * Upload/Download/Delete/Status với auth, CSRF, rate limit, audit log
 */
import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import { verifyCsrfToken } from "../../middlewares/csrfProtection.js";
import { auditLog } from "../../middlewares/auditLogMiddleware.js";
import { documentUploadLimiter } from "../../middlewares/rateLimitMiddleware.js";
import {
  upload,
  download,
  remove,
  getStatus,
} from "../../controllers/document/document.controller.js";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_FILE_SIZE_BYTES,
} from "../../middlewares/uploadMiddleware.js";

const router = Router();

const allowedMimeSet = new Set(ALLOWED_UPLOAD_MIME_TYPES);

const uploadHandler = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeSet.has(file.mimetype)) {
      const error = new Error(
        "Định dạng tệp không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP hoặc PDF",
      );
      error.statusCode = 400;
      error.errorCode = "VALIDATION_ERROR";
      return cb(error);
    }
    cb(null, true);
  },
});

// All document routes require authentication
router.use(authenticate);

// Business owner upload document
router.post(
  "/:businessId/upload",
  documentUploadLimiter,
  verifyCsrfToken,
  uploadHandler.single("file"),
  auditLog({
    action: "UPLOAD_DOCUMENT",
    tableName: "sensitive_documents",
    getNewData: (req) => ({
      businessId: req.params.businessId,
      type: req.body.type,
    }),
  }),
  upload,
);

// Download document (admin hoặc owner — authorization trong service)
router.get("/download/:documentId", download);

// Check document status (không expose URLs)
router.get("/:businessId/status", getStatus);

// Delete document (admin only)
router.delete(
  "/:businessId/:documentId",
  hasPermission("business.approve"),
  auditLog({
    action: "DELETE_DOCUMENT",
    tableName: "sensitive_documents",
    getNewData: (req) => ({
      businessId: req.params.businessId,
      documentId: req.params.documentId,
    }),
  }),
  remove,
);

export default router;
