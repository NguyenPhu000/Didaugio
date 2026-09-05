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

const resolveStatusCode = (err, isZodError) => {
  const parsedStatusCode = Number(err.statusCode);
  if (isZodError) return 400;
  if (Number.isInteger(parsedStatusCode) && parsedStatusCode >= 100 && parsedStatusCode <= 599) {
    return parsedStatusCode;
  }
  return 500;
};

const logHandledError = (err, req, statusCode, errorCode) => {
  if (statusCode >= 500) {
    logger.error(err.stack || err.message);
    return;
  }
  logger.warn(
    `[WARN] ${req.method} ${req.originalUrl} -> ${statusCode} ${errorCode || "BUSINESS_ERROR"}: ${err.message}`,
  );
};

const handleZodError = (err, res) => {
  if (!(err instanceof ZodError)) return null;
  const firstError = err.issues[0];
  return sendError(res, 400, {
    success: false,
    data: null,
    message: firstError?.message || "Lỗi dữ liệu không hợp lệ",
    errorCode: ERROR_CODES.VALIDATION_ERROR,
    errors: err.issues.map((issue) => ({
      field: issue.path?.join(".") || "",
      message: issue.message,
    })),
  });
};

const handleMulterError = (err, res) => {
  if (!(err instanceof multer.MulterError)) return null;
  if (err.code === "LIMIT_FILE_SIZE") {
    return sendError(res, 413, {
      success: false,
      data: null,
      message: "Tệp tải lên vượt quá 8MB. Vui lòng chọn tệp nhỏ hơn",
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
};

const handleKnownDatabaseError = (err, res) => {
  const knownErrors = {
    P2002: [400, "Dữ liệu đã tồn tại trong hệ thống", ERROR_CODES.DUPLICATE_ERROR],
    P2025: [404, "Không tìm thấy dữ liệu yêu cầu", ERROR_CODES.NOT_FOUND],
  };
  const definition = knownErrors[err.code];
  if (!definition) return null;
  const [statusCode, message, errorCode] = definition;
  return sendError(res, statusCode, {
    success: false,
    data: null,
    message,
    errorCode,
  });
};

const errorHandler = (err, req, res, next) => {
  const isZodError = err instanceof ZodError;
  const statusCode = resolveStatusCode(err, isZodError);
  const isServerError = statusCode >= 500;
  const errorCode = isZodError
    ? ERROR_CODES.VALIDATION_ERROR
    : typeof err.errorCode === "string"
      ? err.errorCode
      : null;

  logHandledError(err, req, statusCode, errorCode);
  const zodResponse = handleZodError(err, res);
  if (zodResponse) return zodResponse;
  const multerResponse = handleMulterError(err, res);
  if (multerResponse) return multerResponse;
  const databaseResponse = handleKnownDatabaseError(err, res);
  if (databaseResponse) return databaseResponse;

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
