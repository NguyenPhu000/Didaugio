import { ZodError } from "zod";
import { ERROR_CODES } from "../config/messages.js";

export const validateSchema = (schema, source = "body") => {
  return async (req, res, next) => {
    try {
      if (req[source] == null || typeof req[source] !== "object") {
        req[source] = {};
      }
      const validatedData = await schema.parseAsync(req[source]);

      // Mutate in-place vì req.query có thể là read-only getter
      Object.defineProperty(req, source, {
        configurable: true,
        enumerable: true,
        value: validatedData,
        writable: true,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const zodErrors = error.issues || error.errors || [];

        const formattedErrors = zodErrors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        console.error(
          "Validation Errors:",
          JSON.stringify(formattedErrors, null, 2),
        );

        return res.status(400).json({
          success: false,
          data: null,
          message: "Dữ liệu không hợp lệ",
          errorCode: ERROR_CODES.VALIDATION_ERROR,
          errors: formattedErrors,
        });
      }

      console.error("[validateSchema] Internal error:", error);
      return res.status(500).json({
        success: false,
        data: null,
        message: "Lỗi hệ thống, vui lòng thử lại sau",
        errorCode: ERROR_CODES.INTERNAL_ERROR,
      });
    }
  };
};

export const validateBody = (schema) => validateSchema(schema, "body");
export const validateQuery = (schema) => validateSchema(schema, "query");
export const validateParams = (schema) => validateSchema(schema, "params");

export default { validateSchema, validateBody, validateQuery, validateParams };
