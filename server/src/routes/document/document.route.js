/**
 * Document Routes — Tài liệu nhạy cảm (CCCD, giấy phép kinh doanh)
 * Upload/Download/Delete/Status với auth, CSRF, rate limit, audit log
 */
import { Router } from "express";
import multer from "multer";
import prisma from "../../config/prismaClient.js";
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

const canDeleteDocument = async (req, res, next) => {
  try {
    const businessId = parseInt(req.params.businessId, 10);
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    // Admin hoặc Superadmin luôn được phép
    if (roleId <= 4) {
      return next();
    }

    // Kiểm tra xem user hiện tại có phải là chủ sở hữu của doanh nghiệp này không
    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId: userId },
      select: { id: true },
    });

    if (business) {
      return next();
    }

    return res.status(403).json({
      success: false,
      data: null,
      message: "Bạn không có quyền xóa tài liệu của doanh nghiệp này",
      errorCode: "FORBIDDEN_NOT_OWNER",
    });
  } catch (error) {
    console.error("Check delete document permission error:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Lỗi hệ thống khi kiểm tra quyền xóa tài liệu",
      errorCode: "INTERNAL_ERROR",
    });
  }
};

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
  canDeleteDocument,
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
