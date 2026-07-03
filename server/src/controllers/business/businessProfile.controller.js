/**
 * Business Profile Controller - SRP: Xử lý request hồ sơ doanh nghiệp
 */
import * as businessProfileService from "../../services/business/businessProfile.service.js";
import * as contractStorageService from "../../services/contract/contractStorage.service.js";
import { decryptField, isEncrypted } from "../../utils/fieldEncryption.js";
import prisma from "../../config/prismaClient.js";
import { isAdminOrSuperAdminRole } from "../../config/constants.js";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_BASE64_DATA_URI_LENGTH,
  MAX_UPLOAD_FILE_SIZE_BYTES,
} from "../../middlewares/uploadMiddleware.js";

const ALLOWED_UPLOAD_MIME_TYPE_SET = new Set(ALLOWED_UPLOAD_MIME_TYPES);
const MAX_UPLOAD_FILE_SIZE_MB = Math.floor(
  MAX_UPLOAD_FILE_SIZE_BYTES / (1024 * 1024),
);

const toStoredFileValue = (file) => {
  if (!file) return null;
  if (file.path) return file.path;

  if (file.buffer) {
    const mimeType = file.mimetype || "application/octet-stream";

    if (!ALLOWED_UPLOAD_MIME_TYPE_SET.has(mimeType)) {
      const error = new Error(
        "Định dạng tệp không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP hoặc PDF",
      );
      error.statusCode = 400;
      error.errorCode = "VALIDATION_ERROR";
      throw error;
    }

    if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
      const error = new Error(
        `Tệp tải lên vượt quá ${MAX_UPLOAD_FILE_SIZE_MB}MB. Vui lòng chọn tệp nhỏ hơn`,
      );
      error.statusCode = 413;
      error.errorCode = "VALIDATION_ERROR";
      throw error;
    }

    const base64 = file.buffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64}`;

    if (dataUri.length > MAX_BASE64_DATA_URI_LENGTH) {
      const error = new Error(
        "Dữ liệu tệp sau mã hóa base64 vượt giới hạn lưu trữ. Vui lòng giảm kích thước tệp",
      );
      error.statusCode = 413;
      error.errorCode = "VALIDATION_ERROR";
      throw error;
    }

    return dataUri;
  }

  return null;
};

export const getProfile = async (req, res, next) => {
  try {
    const business = await businessProfileService.getProfile(req.user.userId);
    res.json({
      success: true,
      data: business,
      message: "Lấy hồ sơ doanh nghiệp thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const data = { ...req.body };

    if (req.files?.idCardFront?.[0]) {
      data.idCardFront = toStoredFileValue(req.files.idCardFront[0]);
    }
    if (req.files?.idCardBack?.[0]) {
      data.idCardBack = toStoredFileValue(req.files.idCardBack[0]);
    }
    if (req.files?.businessLicense?.[0]) {
      data.businessLicense = toStoredFileValue(req.files.businessLicense[0]);
    }

    const business = await businessProfileService.register(
      data,
      req.user.userId,
    );
    res.status(201).json({
      success: true,
      message: "Đăng ký doanh nghiệp thành công, đang chờ duyệt",
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const previousBusiness = await businessProfileService.getProfile(
      req.user.userId,
    );
    const data = { ...req.body };

    if (req.files?.idCardFront?.[0]) {
      data.idCardFront = toStoredFileValue(req.files.idCardFront[0]);
    }
    if (req.files?.idCardBack?.[0]) {
      data.idCardBack = toStoredFileValue(req.files.idCardBack[0]);
    }
    if (req.files?.businessLicense?.[0]) {
      data.businessLicense = toStoredFileValue(req.files.businessLicense[0]);
    }

    const business = await businessProfileService.updateProfile(
      data,
      req.user.userId,
    );

    const isResubmitted =
      previousBusiness?.status !== "pending" && business?.status === "pending";

    res.json({
      success: true,
      message: isResubmitted
        ? "Cập nhật hồ sơ thành công và đã gửi duyệt lại"
        : "Cập nhật hồ sơ thành công",
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyPlaces = async (req, res, next) => {
  try {
    const places = await businessProfileService.getMyPlaces(req.user.userId);
    res.json({ success: true, data: places });
  } catch (error) {
    next(error);
  }
};

export const signContract = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // 1. Xác thực OTP và cập nhật thông tin Bên A (CCCD, địa chỉ, họ tên) vào DB
    const business = await businessProfileService.signContract(userId, req.body);
    const businessId = business.id;

    // 2. Nếu chưa có PDF hợp đồng thì tạo trước
    const rawBusiness = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        contractPdfPath: true,
        businessName: true,
        taxCode: true,
        commissionRate: true,
        idCardNumber: true,
        signerMetadata: true,
        owner: {
          select: {
            email: true,
            profile: { select: { fullName: true, address: true, phone: true } },
          },
        },
      },
    });

    if (!rawBusiness?.contractPdfPath) {
      const getDecrypted = (val) => {
        if (!val) return "";
        if (isEncrypted(val)) {
          try {
            return decryptField(val);
          } catch {
            return "";
          }
        }
        return val;
      };

      const decTaxCode = getDecrypted(rawBusiness.taxCode);
      const decIdCard = getDecrypted(rawBusiness.idCardNumber);
      const meta = typeof rawBusiness.signerMetadata === "object" && rawBusiness.signerMetadata !== null 
        ? rawBusiness.signerMetadata 
        : {};

      // Tạo PDF hợp đồng nháp ngay tại thời điểm ký
      await contractStorageService.createContract({
        businessId,
        businessName: rawBusiness?.businessName || `Business #${businessId}`,
        taxCode: decTaxCode || "",
        address: rawBusiness?.owner?.profile?.address || "",
        commissionRate: rawBusiness?.commissionRate ? Number(rawBusiness.commissionRate) : 15,
        ownerName: rawBusiness?.owner?.profile?.fullName || "",
        idCardNumberMasked: decIdCard || "",
        idCardIssuedDate: meta.idCardIssuedDate || "",
        idCardIssuedPlace: meta.idCardIssuedPlace || "",
        phone: rawBusiness?.owner?.profile?.phone || "",
        email: rawBusiness?.owner?.email || "",
      });
    }

    // 3. Gọi contractStorage.signContract để embed chữ ký vào PDF
    const signerMetadata = {
      ip: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
      userAgent: req.headers["user-agent"],
      signedAt: req.body.signedAt,
      ...(req.body.signerMetadata || {}),
    };

    const result = await contractStorageService.signContract(
      businessId,
      req.body.signatureData,
      signerMetadata,
    );

    res.json({
      success: true,
      data: {
        contractSigned: result.contractSigned,
        contractSignedAt: result.contractSignedAt,
        contractVersion: result.contractVersion,
      },
      message: "Ký hợp đồng doanh nghiệp thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const downloadContract = async (req, res, next) => {
  try {
    const businessId = parseInt(req.params.id, 10);
    if (Number.isNaN(businessId)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID doanh nghiệp không hợp lệ",
      });
    }

    // Kiểm tra quyền: chỉ chủ doanh nghiệp hoặc admin mới được download
    const isAdmin = isAdminOrSuperAdminRole(req.user?.roleId);
    if (!isAdmin) {
      const profile = await businessProfileService.getProfile(req.user.userId);
      if (profile?.id !== businessId) {
        return res.status(403).json({
          success: false,
          data: null,
          message: "Bạn không có quyền tải hợp đồng này",
        });
      }
    }

    // Kiểm tra business có PDF chưa, nếu chưa → tạo lại
    const rawBusiness = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        contractPdfPath: true,
        businessName: true,
        taxCode: true,
        idCardNumber: true,
        commissionRate: true,
        contractSigned: true,
        signerMetadata: true,
        approvedAt: true,
        status: true,
        owner: {
          select: {
            email: true,
            profile: { select: { fullName: true, address: true, phone: true } },
          },
        },
      },
    });

    if (!rawBusiness) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Doanh nghiệp không tồn tại",
      });
    }

    const adminSignedParam = req.query.adminSigned === "true";

    if (!rawBusiness.contractPdfPath || adminSignedParam) {
      const getDecrypted = (val) => {
        if (!val) return "";
        if (isEncrypted(val)) {
          try {
            return decryptField(val);
          } catch {
            return "";
          }
        }
        return val;
      };

      const decTaxCode = getDecrypted(rawBusiness.taxCode);
      const decIdCard = getDecrypted(rawBusiness.idCardNumber);
      const meta = typeof rawBusiness.signerMetadata === "object" && rawBusiness.signerMetadata !== null 
        ? rawBusiness.signerMetadata 
        : {};

      const businessData = {
        businessId,
        businessName: rawBusiness.businessName || `Business #${businessId}`,
        taxCode: decTaxCode || "",
        address: rawBusiness.owner?.profile?.address || "",
        commissionRate: rawBusiness.commissionRate ? Number(rawBusiness.commissionRate) : 10,
        ownerName: rawBusiness.owner?.profile?.fullName || "",
        idCardNumberMasked: decIdCard || "",
        idCardIssuedDate: meta.idCardIssuedDate || "",
        idCardIssuedPlace: meta.idCardIssuedPlace || "",
        phone: rawBusiness.owner?.profile?.phone || "",
        email: rawBusiness.owner?.email || "",
        signatureImage: meta.signatureData || null,
        approvedAt: adminSignedParam ? (rawBusiness.approvedAt || new Date()) : (rawBusiness.approvedAt || null),
        status: adminSignedParam ? "approved" : (rawBusiness.status || null),
      };

      if (adminSignedParam) {
        const pdfBuffer = await contractStorageService.generateContractPdf(businessData);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="preview-contract-${businessId}.pdf"`);
        res.setHeader("Content-Length", pdfBuffer.length);
        return res.send(pdfBuffer);
      } else {
        // Tạo lại PDF cho hợp đồng đã ký nhưng thiếu file
        await contractStorageService.createContract(businessData);
      }
    }

    const { buffer, filename } = await contractStorageService.downloadContract(businessId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};


export const decryptProfile = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Vui lòng nhập mật khẩu xác thực",
        errorCode: "PASSWORD_REQUIRED",
      });
    }

    const decryptedData = await businessProfileService.decryptProfile(
      req.user.userId,
      password,
    );

    res.json({
      success: true,
      data: decryptedData,
      message: "Giải mã dữ liệu thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const sendContractOtp = async (req, res, next) => {
  try {
    const result = await businessProfileService.sendContractOtp(req.user.userId);
    res.json({
      success: true,
      data: result,
      message: "Mã OTP xác thực ký hợp đồng đã được gửi qua email của bạn",
    });
  } catch (error) {
    next(error);
  }
};
