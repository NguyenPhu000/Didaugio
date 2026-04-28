/**
 * Business Profile Controller - SRP: Xử lý request hồ sơ doanh nghiệp
 */
import * as businessProfileService from "../../services/business/businessProfile.service.js";
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
    const business = await businessProfileService.signContract(
      req.user.userId,
      req.body,
    );
    res.json({
      success: true,
      data: business,
      message: "Ký hợp đồng doanh nghiệp thành công",
    });
  } catch (error) {
    next(error);
  }
};
