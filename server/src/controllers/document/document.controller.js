/**
 * Document Controller — SRP: Xử lý request tài liệu nhạy cảm (CCCD, giấy phép)
 * Service layer xử lý validation, authorization, encryption; controller chỉ map request/response.
 */
import * as documentStorage from "../../services/document/documentStorage.service.js";
import logger from "../../config/logger.js";

const toSafeHeaderFilename = (value) =>
  String(value || "document")
    .replace(/[\r\n"]/g, "_")
    .replace(/[\\/]/g, "_")
    .slice(0, 180);

/**
 * Upload tài liệu nhạy cảm (business owner)
 * POST /api/documents/:businessId/upload
 */
export const upload = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { type } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Vui lòng chọn tệp tải lên",
        errorCode: "FILE_MISSING",
      });
    }

    const result = await documentStorage.uploadDocument({
      businessId: parseInt(businessId, 10),
      type,
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
    });

    res.status(201).json({
      success: true,
      data: result,
      message: "Tải tài liệu thành công",
    });
  } catch (error) {
    logger.error("Upload document error:", error);
    next(error);
  }
};

/**
 * Download tài liệu nhạy cảm (admin hoặc owner)
 * GET /api/documents/download/:documentId
 */
export const download = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const result = await documentStorage.downloadDocument({
      documentId: parseInt(documentId, 10),
      requesterId: req.user.userId,
      requesterRoleId: req.user.roleId,
    });

    res.setHeader("Content-Type", result.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${toSafeHeaderFilename(result.originalName)}"`,
    );
    res.send(result.buffer);
  } catch (error) {
    logger.error("Download document error:", error);
    next(error);
  }
};

/**
 * Xóa tài liệu nhạy cảm (admin only)
 * DELETE /api/documents/:businessId/:documentId
 */
export const remove = async (req, res, next) => {
  try {
    const { businessId, documentId } = req.params;

    await documentStorage.deleteDocument({
      documentId: parseInt(documentId, 10),
      businessId: parseInt(businessId, 10),
    });

    res.json({
      success: true,
      data: null,
      message: "Đã xóa tài liệu",
    });
  } catch (error) {
    logger.error("Delete document error:", error);
    next(error);
  }
};

/**
 * Kiểm tra trạng thái upload tài liệu (không expose URLs)
 * GET /api/documents/:businessId/status
 */
export const getStatus = async (req, res, next) => {
  try {
    const { businessId } = req.params;

    const status = await documentStorage.getDocumentStatus(
      parseInt(businessId, 10),
    );

    res.json({ success: true, data: status });
  } catch (error) {
    logger.error("Get document status error:", error);
    next(error);
  }
};
