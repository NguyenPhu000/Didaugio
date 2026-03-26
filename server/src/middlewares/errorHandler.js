import { ERROR_CODES } from "../config/messages.js";
import { ZodError } from "zod";
import multer from "multer";

const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  console.error(err.stack);

  if (err instanceof ZodError) {
    const firstError = err.errors?.[0];
    return res.status(400).json({
      success: false,
      data: null,
      message: firstError?.message || "Loi validation",
      errorCode: ERROR_CODES.VALIDATION_ERROR,
      errors:
        err.errors?.map((e) => ({
          field: e.path?.join(".") || "",
          message: e.message,
        })) || [],
    });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        data: null,
        message: "Tệp tải lên vượt quá 10MB. Vui lòng chọn tệp nhỏ hơn",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Trường tệp không hợp lệ hoặc số lượng tệp vượt giới hạn",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    return res.status(400).json({
      success: false,
      data: null,
      message: err.message || "Dữ liệu tệp tải lên không hợp lệ",
      errorCode: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  if (err.code === "P2002") {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Du lieu da ton tai",
      errorCode: ERROR_CODES.DUPLICATE_ERROR,
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      data: null,
      message: "Khong tim thay du lieu",
      errorCode: ERROR_CODES.NOT_FOUND,
    });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    data: null,
    message: err.message || "Loi he thong",
    errorCode: err.errorCode || ERROR_CODES.INTERNAL_ERROR,
  });
};

export default errorHandler;
