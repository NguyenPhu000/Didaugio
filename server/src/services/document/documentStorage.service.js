/**
 * Document Storage Service — Upload/Download/Delete tài liệu nhạy cảm
 * Flow: Buffer → Encrypt AES-256-GCM → Ghi disk → Lưu metadata vào Prisma
 */

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import prisma from "../../config/prismaClient.js";
import { encryptFile, decryptFile, computeChecksum } from "./fileEncryption.service.js";
import { createAuditLog } from "../../middlewares/auditLogMiddleware.js";
import logger from "../../config/logger.js";

const STORAGE_DIR = path.resolve(
  process.cwd(),
  process.env.SENSITIVE_STORAGE_DIR || "storage/sensitive",
);

const ALLOWED_TYPES = ["id_card_front", "id_card_back", "business_license", "certificate"];
const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Đảm bảo thư mục storage tồn tại
 */
async function ensureStorageDir() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
}

/**
 * Tạo tên file ngẫu nhiên, không expose tên gốc
 * @param {number} businessId
 * @param {string} type
 * @returns {string}
 */
function generateFilename(businessId, type) {
  const random = crypto.randomBytes(16).toString("hex");
  return `${businessId}_${type}_${random}.enc`;
}

/**
 * Upload và encrypt tài liệu nhạy cảm
 * Hỗ trợ nhiều file cùng loại (CCCD, giấy phép, chứng nhận,...)
 * @param {{ businessId: number, type: string, buffer: Buffer, mimeType: string, originalName: string }} params
 * @returns {Promise<{ id: number, type: string, mimeType: string, fileSize: number }>}
 */
export const uploadDocument = async ({
  businessId,
  type,
  buffer,
  mimeType,
  originalName,
}) => {
  if (!ALLOWED_TYPES.includes(type)) {
    const err = new Error("Loại tài liệu không hợp lệ");
    err.statusCode = 400;
    throw err;
  }
  if (!ALLOWED_MIME.includes(mimeType)) {
    const err = new Error("Định dạng tệp không hợp lệ");
    err.statusCode = 400;
    throw err;
  }
  if (buffer.length > MAX_FILE_SIZE) {
    const err = new Error("Tệp vượt quá 10MB");
    err.statusCode = 413;
    throw err;
  }

  await ensureStorageDir();

  const { encrypted, iv, authTag } = encryptFile(buffer);
  const checksum = computeChecksum(buffer);

  const filename = generateFilename(businessId, type);
  const filePath = path.join(STORAGE_DIR, filename);
  await fs.writeFile(filePath, encrypted);

  // Tính sortOrder tiếp theo cho loại tài liệu này
  const lastDoc = await prisma.sensitiveDocument.findFirst({
    where: { businessId, type },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const nextSortOrder = (lastDoc?.sortOrder ?? -1) + 1;

  const record = await prisma.sensitiveDocument.create({
    data: {
      businessId,
      type,
      sortOrder: nextSortOrder,
      encryptedPath: filename,
      iv,
      authTag,
      mimeType,
      originalName,
      fileSize: buffer.length,
      checksum,
    },
  });

  logger.info(`Document uploaded: business=${businessId}, type=${type}, sortOrder=${nextSortOrder}, size=${buffer.length}`);

  await createAuditLog({
    userId: 0,
    action: "DOCUMENT_UPLOAD",
    tableName: "sensitive_documents",
    recordId: record.id,
    description: `Tải lên tài liệu ${type} cho doanh nghiệp #${businessId}`,
    newData: { type, businessId, mimeType, fileSize: buffer.length },
  }).catch(() => {});

  return { id: record.id, type, mimeType, fileSize: buffer.length };
};

/**
 * Download và decrypt tài liệu nhạy cảm
 * @param {{ documentId: number, requesterId: number, requesterRole: string }} params
 * @returns {Promise<{ buffer: Buffer, mimeType: string, originalName: string }>}
 */
export const downloadDocument = async ({
  documentId,
  requesterId,
  requesterRoleId,
}) => {
  const record = await prisma.sensitiveDocument.findUnique({
    where: { id: documentId },
    include: { business: { select: { ownerId: true } } },
  });

  if (!record) {
    const err = new Error("Tài liệu không tồn tại");
    err.statusCode = 404;
    throw err;
  }

  const isAdmin = requesterRoleId === 1 || requesterRoleId === 2;
  const isOwner = record.business.ownerId === requesterId;
  if (!isAdmin && !isOwner) {
    const err = new Error("Không có quyền truy cập tài liệu này");
    err.statusCode = 403;
    throw err;
  }

  const encryptedBuffer = await fs.readFile(
    path.join(STORAGE_DIR, record.encryptedPath),
  );
  const buffer = decryptFile(encryptedBuffer, record.iv, record.authTag);

  const checksum = computeChecksum(buffer);
  if (checksum !== record.checksum) {
    logger.error(
      `Document integrity check failed: business=${record.businessId}, type=${record.type}, documentId=${documentId}`,
    );
    const err = new Error("Tài liệu bị lỗi hoặc bị thay đổi");
    err.statusCode = 500;
    throw err;
  }

  logger.info(
    `Document accessed: business=${record.businessId}, type=${record.type}, user=${requesterId}`,
  );

  await createAuditLog({
    userId: requesterId,
    action: "DOCUMENT_DOWNLOAD",
    tableName: "sensitive_documents",
    recordId: documentId,
    description: `Tải xuống tài liệu ${record.type} của doanh nghiệp #${record.businessId}`,
    newData: { requesterId, type: record.type },
  }).catch(() => {});

  return {
    buffer,
    mimeType: record.mimeType,
    originalName: record.originalName,
  };
};

/**
 * Xóa tài liệu nhạy cảm
 * @param {{ documentId: number, businessId: number }} params
 * @returns {Promise<void>}
 */
export const deleteDocument = async ({ documentId, businessId }) => {
  const record = await prisma.sensitiveDocument.findFirst({
    where: { id: documentId, businessId },
  });

  if (!record) {
    const err = new Error("Tài liệu không tồn tại");
    err.statusCode = 404;
    throw err;
  }

  const filePath = path.join(STORAGE_DIR, record.encryptedPath);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }

  await prisma.sensitiveDocument.delete({ where: { id: record.id } });

  logger.info(`Document deleted: business=${businessId}, type=${record.type}`);

  await createAuditLog({
    userId: 0,
    action: "DOCUMENT_DELETE",
    tableName: "sensitive_documents",
    recordId: documentId,
    description: `Xóa tài liệu ${record.type} của doanh nghiệp #${businessId}`,
  }).catch(() => {});
};

/**
 * Kiểm tra trạng thái upload tài liệu của một business
 * Trả về mảng documents cho mỗi loại (hỗ trợ nhiều file cùng loại)
 * @param {number} businessId
 * @returns {Promise<Object>}
 */
export const getDocumentStatus = async (businessId) => {
  const documents = await prisma.sensitiveDocument.findMany({
    where: { businessId },
    select: {
      id: true,
      type: true,
      sortOrder: true,
      originalName: true,
      mimeType: true,
      fileSize: true,
      createdAt: true,
    },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
  });

  const status = {};
  for (const type of ALLOWED_TYPES) {
    status[type] = [];
  }

  for (const doc of documents) {
    if (status[doc.type]) {
      status[doc.type].push({
        id: doc.id,
        sortOrder: doc.sortOrder,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        uploadedAt: doc.createdAt,
      });
    }
  }

  return status;
};
