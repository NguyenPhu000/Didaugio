import { ZodError } from "zod";

export const validateSchema = (schema, source = "body") => {
  return async (req, res, next) => {
    try {
      if (req[source] == null || typeof req[source] !== "object") {
        req[source] = {};
      }
      const validatedData = await schema.parseAsync(req[source]);

      // Mutate in-place vì req.query có thể là read-only getter
      const targetObject = req[source];
      for (const key in targetObject) {
        delete targetObject[key];
      }
      Object.assign(targetObject, validatedData);

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
          message: "Dữ liệu không hợp lệ",
          errors: formattedErrors,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Lỗi xử lý validation",
        error: error.message,
      });
    }
  };
};

export const validateBody = (schema) => validateSchema(schema, "body");
export const validateQuery = (schema) => validateSchema(schema, "query");
export const validateParams = (schema) => validateSchema(schema, "params");

export default { validateSchema, validateBody, validateQuery, validateParams };
