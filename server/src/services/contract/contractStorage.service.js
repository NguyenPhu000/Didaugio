/**
 * Contract Storage Service — Tạo, lưu trữ và quản lý hợp đồng PDF đã mã hóa
 * Flow: Generate PDF → Encrypt AES-256-GCM → Ghi disk → Lưu metadata vào Business
 *
 * YÊU CẦU: Business model cần thêm các field:
 *   contractPdfPath, contractPdfIv, contractPdfAuthTag, contractPdfChecksum
 * (Xem Phase 2.6 trong business_flow_optimization.plan.md)
 */

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import prisma from "../../config/prismaClient.js";
import { encryptFile, decryptFile, computeChecksum } from "../document/fileEncryption.service.js";
import { generateContractPdf, embedSignatureInPdf } from "./contractTemplate.service.js";
import {
  createSignatureHash,
  buildSignerMetadata,
  isValidSignatureData,
} from "./eSignature.service.js";
import logger from "../../config/logger.js";

const STORAGE_DIR = path.resolve(
  process.cwd(),
  process.env.SENSITIVE_STORAGE_DIR || "storage/sensitive",
);

const CURRENT_CONTRACT_VERSION = "v1";

/**
 * Đảm bảo thư mục storage tồn tại
 */
async function ensureStorageDir() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
}

/**
 * Tạo tên file hợp đồng ngẫu nhiên
 * @param {number} businessId
 * @returns {string}
 */
function generateContractFilename(businessId) {
  const random = crypto.randomBytes(16).toString("hex");
  return `${businessId}_contract_${random}.enc`;
}

/**
 * Tạo hợp đồng PDF khi admin approve business
 * Chạy trong background (không block API response)
 *
 * @param {Object} businessData
 * @param {number} businessData.businessId
 * @param {string} businessData.businessName
 * @param {string} [businessData.taxCode]
 * @param {string} [businessData.address]
 * @param {number} [businessData.commissionRate]
 * @param {string} [businessData.ownerName]
 * @param {string} [businessData.idCardNumberMasked]
 * @returns {Promise<{ filename: string, checksum: string }>}
 */
export const createContract = async (businessData) => {
  await ensureStorageDir();

  // 1. Generate PDF
  const pdfBuffer = await generateContractPdf(businessData);
  const checksum = computeChecksum(pdfBuffer);

  // 2. Encrypt
  const { encrypted, iv, authTag } = encryptFile(pdfBuffer);

  // 3. Ghi encrypted file ra disk
  const filename = generateContractFilename(businessData.businessId);
  const filePath = path.join(STORAGE_DIR, filename);
  await fs.writeFile(filePath, encrypted);

  // 4. Lưu metadata vào Business record
  await prisma.business.update({
    where: { id: businessData.businessId },
    data: {
      contractPdfPath: filename,
      contractPdfIv: iv,
      contractPdfAuthTag: authTag,
      contractPdfChecksum: checksum,
      contractVersion: CURRENT_CONTRACT_VERSION,
    },
  });

  logger.info(
    `Contract PDF created: business=${businessData.businessId}, checksum=${checksum.substring(0, 16)}...`,
  );

  return { filename, checksum };
};

/**
 * Ký hợp đồng — embed chữ ký canvas vào PDF, mã hóa lại và lưu
 *
 * @param {number} businessId
 * @param {string} signatureBase64 - Base64 PNG từ canvas
 * @param {Object} signerMetadata - Metadata người ký { ip, userAgent, signedAt, ... }
 * @returns {Promise<Object>} Updated business data
 */
export const signContract = async (businessId, signatureBase64, signerMetadata = {}) => {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      contractPdfPath: true,
      contractPdfIv: true,
      contractPdfAuthTag: true,
      contractPdfChecksum: true,
      contractSigned: true,
      contractVersion: true,
    },
  });

  if (!business) {
    const err = new Error("Doanh nghiệp không tồn tại");
    err.statusCode = 404;
    throw err;
  }

  if (!business.contractPdfPath) {
    const err = new Error("Hợp đồng PDF chưa được tạo. Vui lòng chờ admin duyệt.");
    err.statusCode = 404;
    throw err;
  }

  if (business.contractSigned && business.contractVersion === CURRENT_CONTRACT_VERSION) {
    const err = new Error("Hợp đồng đã được ký trước đó");
    err.statusCode = 409;
    throw err;
  }

  // 1. Đọc và decrypt PDF gốc
  const encryptedBuffer = await fs.readFile(
    path.join(STORAGE_DIR, business.contractPdfPath),
  );
  const originalPdf = decryptFile(
    encryptedBuffer,
    business.contractPdfIv,
    business.contractPdfAuthTag,
  );

  // 2. Embed chữ ký vào PDF
  const signedPdf = await embedSignatureInPdf(originalPdf, signatureBase64);

  // 3. Re-encrypt PDF đã ký
  const checksum = computeChecksum(signedPdf);
  const { encrypted, iv, authTag } = encryptFile(signedPdf);

  // 4. Ghi đè file cũ
  await fs.writeFile(
    path.join(STORAGE_DIR, business.contractPdfPath),
    encrypted,
  );

  // 5. Tạo signature hash (không lưu full base64)
  const signatureHash = crypto
    .createHash("sha256")
    .update(signatureBase64.substring(0, 200))
    .digest("hex");

  // 6. Update Business record
  const signedAt = signerMetadata.signedAt
    ? new Date(signerMetadata.signedAt)
    : new Date();

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: {
      contractSigned: true,
      contractSignedAt: signedAt,
      contractVersion: CURRENT_CONTRACT_VERSION,
      contractPdfIv: iv,
      contractPdfAuthTag: authTag,
      contractPdfChecksum: checksum,
      signerMetadata: {
        signatureHash,
        signedAt: signedAt.toISOString(),
        ip: signerMetadata.ip || null,
        userAgent: signerMetadata.userAgent || null,
      },
    },
  });

  logger.info(`Contract signed: business=${businessId}, hash=${signatureHash.substring(0, 16)}...`);

  return updated;
};

/**
 * Ký hợp đồng với digital signature hash (HMAC-based, hợp lệ NĐ 130/2018)
 * Phiên bản bảo mật hơn signContract — dùng HMAC thay vì plain SHA-256,
 * validate canvas data, lấy IP/user-agent trực tiếp từ request.
 *
 * @param {number} businessId
 * @param {string} signatureBase64 - Canvas signature PNG (data URI)
 * @param {import("express").Request} req - Express request (lấy IP, user-agent)
 * @returns {Promise<{ signed: boolean, signedAt: string, signatureHash: string }>}
 */
export const signContractWithHash = async (businessId, signatureBase64, req) => {
  if (!isValidSignatureData(signatureBase64)) {
    const err = new Error("Dữ liệu chữ ký không hợp lệ");
    err.statusCode = 400;
    err.errorCode = "INVALID_SIGNATURE_DATA";
    throw err;
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      contractPdfPath: true,
      contractPdfIv: true,
      contractPdfAuthTag: true,
      contractPdfChecksum: true,
      contractSigned: true,
      contractVersion: true,
    },
  });

  if (!business) {
    const err = new Error("Doanh nghiệp không tồn tại");
    err.statusCode = 404;
    throw err;
  }

  if (!business.contractPdfPath) {
    const err = new Error("Hợp đồng PDF chưa được tạo. Vui lòng chờ admin duyệt.");
    err.statusCode = 404;
    throw err;
  }

  if (business.contractSigned && business.contractVersion === CURRENT_CONTRACT_VERSION) {
    const err = new Error("Hợp đồng đã được ký trước đó");
    err.statusCode = 409;
    throw err;
  }

  // 1. Build signer metadata từ request
  const signerMeta = buildSignerMetadata(req);

  // 2. Tạo HMAC-based signature hash
  const signatureHash = createSignatureHash({
    signatureData: signatureBase64,
    businessId,
    userId: req.user.userId,
    ip: signerMeta.ip,
    userAgent: signerMeta.userAgent,
    signedAt: signerMeta.signedAt,
  });

  // 3. Đọc và decrypt PDF gốc
  await ensureStorageDir();
  const encryptedBuffer = await fs.readFile(
    path.join(STORAGE_DIR, business.contractPdfPath),
  );
  const originalPdf = decryptFile(
    encryptedBuffer,
    business.contractPdfIv,
    business.contractPdfAuthTag,
  );

  // 4. Embed chữ ký vào PDF
  const signedPdf = await embedSignatureInPdf(originalPdf, signatureBase64);

  // 5. Re-encrypt PDF đã ký
  const checksum = computeChecksum(signedPdf);
  const { encrypted, iv, authTag } = encryptFile(signedPdf);

  // 6. Ghi đè file cũ
  await fs.writeFile(
    path.join(STORAGE_DIR, business.contractPdfPath),
    encrypted,
  );

  // 7. Update Business record — KHÔNG lưu base64, chỉ lưu hash + metadata
  const signedAt = new Date(signerMeta.signedAt);

  await prisma.business.update({
    where: { id: businessId },
    data: {
      contractSigned: true,
      contractSignedAt: signedAt,
      contractVersion: CURRENT_CONTRACT_VERSION,
      contractPdfIv: iv,
      contractPdfAuthTag: authTag,
      contractPdfChecksum: checksum,
      signerMetadata: {
        hash: signatureHash,
        ip: signerMeta.ip,
        userAgent: signerMeta.userAgent,
        timezone: signerMeta.timezone,
      },
    },
  });

  logger.info(
    `Contract signed with HMAC hash: business=${businessId}, hash=${signatureHash.substring(0, 16)}...`,
  );

  return {
    signed: true,
    signedAt: signerMeta.signedAt,
    signatureHash,
  };
};

/**
 * Download hợp đồng PDF (đã decrypt) để trả về client
 *
 * @param {number} businessId
 * @returns {Promise<{ buffer: Buffer, filename: string }>}
 */
export const downloadContract = async (businessId) => {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      contractPdfPath: true,
      contractPdfIv: true,
      contractPdfAuthTag: true,
      contractPdfChecksum: true,
      businessName: true,
    },
  });

  if (!business?.contractPdfPath) {
    const err = new Error("Hợp đồng PDF chưa được tạo");
    err.statusCode = 404;
    throw err;
  }

  // Đọc và decrypt
  const encryptedBuffer = await fs.readFile(
    path.join(STORAGE_DIR, business.contractPdfPath),
  );
  const buffer = decryptFile(
    encryptedBuffer,
    business.contractPdfIv,
    business.contractPdfAuthTag,
  );

  // Integrity check
  const currentChecksum = computeChecksum(buffer);
  if (currentChecksum !== business.contractPdfChecksum) {
    logger.error(
      `Contract PDF integrity check failed: business=${businessId}`,
    );
    const err = new Error("Tài liệu hợp đồng bị lỗi hoặc bị thay đổi");
    err.statusCode = 500;
    throw err;
  }

  const safeName = (business.businessName || "contract")
    .replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, "_")
    .substring(0, 50);

  return {
    buffer,
    filename: `hop_dong_${safeName}.pdf`,
  };
};

/**
 * Kiểm tra trạng thái hợp đồng của doanh nghiệp
 *
 * @param {number} businessId
 * @returns {Promise<Object>}
 */
export const getContractStatus = async (businessId) => {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      contractSigned: true,
      contractSignedAt: true,
      contractVersion: true,
      contractPdfPath: true,
    },
  });

  if (!business) {
    const err = new Error("Doanh nghiệp không tồn tại");
    err.statusCode = 404;
    throw err;
  }

  return {
    hasContractPdf: !!business.contractPdfPath,
    contractSigned: business.contractSigned,
    contractSignedAt: business.contractSignedAt,
    contractVersion: business.contractVersion,
    isOutdated:
      business.contractSigned &&
      business.contractVersion !== CURRENT_CONTRACT_VERSION,
    currentVersion: CURRENT_CONTRACT_VERSION,
  };
};
