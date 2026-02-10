/**
 * VALIDATION MIDDLEWARE
 * Sử dụng Zod schemas để validate request data
 */

import { ZodError } from "zod";

/**
 * Middleware để validate request body/query/params với Zod schema
 * @param {ZodSchema} schema - Zod schema để validate
 * @param {string} source - Nguồn data: 'body', 'query', 'params'
 */
export const validateSchema = (schema, source = "body") => {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source];

      // Validate với Zod schema
      const validatedData = await schema.parseAsync(dataToValidate);

      // Replace data với validated data (đã được transform/default)
      // Note: req.query might be read-only (getter) for direct assignment,
      // so mutate the existing object properties. This approach is robust for all sources.
      const targetObject = req[source];
      const validData = validatedData;
      
      // Clear existing keys from the target object
      for (const key in targetObject) {
        delete targetObject[key];
      }
      // Assign validated data properties to the target object
      Object.assign(targetObject, validData);
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors thành dạng dễ đọc
        // Zod v3 uses .issues, .errors might be deprecated/removed in v4
        const zodErrors = error.issues || error.errors || [];
        
        const formattedErrors = zodErrors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));
        
        // Log validation errors for debugging
        console.error("Validation Errors:", JSON.stringify(formattedErrors, null, 2));

        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: formattedErrors,
        });
      }

      // Lỗi khác
      return res.status(500).json({
        success: false,
        message: "Lỗi xử lý validation",
        error: error.message,
      });
    }
  };
};

/**
 * Validate body
 */
export const validateBody = (schema) => validateSchema(schema, "body");

/**
 * Validate query
 */
export const validateQuery = (schema) => validateSchema(schema, "query");

/**
 * Validate params
 */
export const validateParams = (schema) => validateSchema(schema, "params");

export default {
  validateSchema,
  validateBody,
  validateQuery,
  validateParams,
};
