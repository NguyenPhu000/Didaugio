import { ERROR_CODES } from "../config/messages.js";
import { ZodError } from "zod";
import multer from "multer";
import logger from "../config/logger.js";

const sendError = (res, statusCode, payload) => {
  const requestId = res.getHeader?.("x-request-id");
  return res.status(statusCode).json({
    ...payload,
    ...(typeof requestId === "string" && requestId ? { requestId } : {}),
  });
};

const errorHandler = (err, req, res, next) => {
  const isZodError = err instanceof ZodError;
  const parsedStatusCode = Number(err.statusCode);
  const statusCode =
    isZodError
      ? 400
      : Number.isInteger(parsedStatusCode) &&
    parsedStatusCode >= 100 &&
    parsedStatusCode <= 599
      ? parsedStatusCode
      : 500;
  const isServerError = statusCode >= 500;
  const errorCode = isZodError
    ? ERROR_CODES.VALIDATION_ERROR
    : typeof err.errorCode === "string"
      ? err.errorCode
      : null;

  if (isServerError) {
    logger.error(err.stack || err.message);
  } else {
    logger.warn(
      `[WARN] ${req.method} ${req.originalUrl} -> ${statusCode} ${errorCode || "BUSINESS_ERROR"}: ${err.message}`,
    );
  }

  if (isZodError) {
    const issues = err.issues;
    const firstError = issues[0];
    return sendError(res, 400, {
      success: false,
      data: null,
      message: firstError?.message || "Lỗi dữ liệu không hợp lệ",
      errorCode: ERROR_CODES.VALIDATION_ERROR,
      errors: issues.map((issue) => ({
        field: issue.path?.join(".") || "",
        message: issue.message,
      })),
    });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return sendError(res, 413, {
        success: false,
        data: null,
        message: "Tệp tải lên vượt quá 10MB. Vui lòng chọn tệp nhỏ hơn",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return sendError(res, 400, {
        success: false,
        data: null,
        message: "Trường tệp không hợp lệ hoặc số lượng tệp vượt giới hạn",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    return sendError(res, 400, {
      success: false,
      data: null,
      message: err.message || "Dữ liệu tệp tải lên không hợp lệ",
      errorCode: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  if (err.code === "P2002") {
    return sendError(res, 400, {
      success: false,
      data: null,
      message: "Dữ liệu đã tồn tại trong hệ thống",
      errorCode: ERROR_CODES.DUPLICATE_ERROR,
    });
  }

  if (err.code === "P2025") {
    return sendError(res, 404, {
      success: false,
      data: null,
      message: "Không tìm thấy dữ liệu yêu cầu",
      errorCode: ERROR_CODES.NOT_FOUND,
    });
  }

  const payload = {
    success: false,
    data: null,
    message: isServerError
      ? "Lỗi hệ thống, vui lòng thử lại sau"
      : err.message || "Yêu cầu không hợp lệ",
    errorCode: errorCode || ERROR_CODES.INTERNAL_ERROR,
  };
  if (
    errorCode === "AI_CONFIG_CONFLICT" &&
    Number.isSafeInteger(err.currentRevision) &&
    err.currentRevision >= 0
  ) {
    payload.currentRevision = err.currentRevision;
  }
  return sendError(res, statusCode, payload);
};

export default errorHandler;
