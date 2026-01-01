import { ERROR_CODES } from "../config/constants.js";
import { ZodError } from "zod";

// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  console.error(err.stack);

  // Zod validation errors
  if (err instanceof ZodError) {
    const firstError = err.errors[0];
    return res.status(400).json({
      success: false,
      data: null,
      message: firstError.message,
      errorCode: ERROR_CODES.VALIDATION_ERROR,
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Prisma errors
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

  // Default error response (Rule 5.1)
  return res.status(err.statusCode || 500).json({
    success: false,
    data: null,
    message: err.message || "Loi he thong",
    errorCode: err.errorCode || ERROR_CODES.INTERNAL_ERROR,
  });
};

export default errorHandler;
