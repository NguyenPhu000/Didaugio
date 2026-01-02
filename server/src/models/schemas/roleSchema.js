import { z } from "zod";

// =============================================================================
// SHARED SCHEMAS
// =============================================================================

// Schema cho ID (dùng chung)
export const idSchema = z.object({
  id: z.coerce.number().int().positive({
    message: "ID phải là số nguyên dương",
  }),
});

// Schema cho pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

// =============================================================================
// ROLE SCHEMAS
// =============================================================================

// Schema cho query params khi lấy danh sách roles
export const roleQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  includePermissions: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional()
    .default("false"),
  includeUserCount: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional()
    .default("false"),
});

// Schema cho việc cập nhật permissions của role
export const updateRolePermissionsSchema = z
  .object({
    permissionIds: z
      .array(z.number().int().positive())
      .min(0, { message: "Danh sách quyền không hợp lệ" })
      .max(100, { message: "Không thể cấp quá 100 quyền cùng lúc" }),
  })
  .strict();

// Schema cho query lấy users theo role
export const roleUsersQuerySchema = paginationSchema.extend({
  status: z.enum(["active", "inactive", "banned", "pending"]).optional(),
  search: z.string().optional(),
});

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate ID parameter
 * @param {any} id - ID cần validate
 * @returns {number} ID đã validate
 * @throws {ZodError} Nếu ID không hợp lệ
 */
export const validateRoleId = (id) => {
  return idSchema.parse({ id }).id;
};

/**
 * Validate query params cho danh sách roles
 * @param {object} query - Query object từ req.query
 * @returns {object} Query đã validate và transform
 */
export const validateRoleQuery = (query) => {
  return roleQuerySchema.parse(query);
};

/**
 * Validate permission IDs khi cập nhật
 * @param {object} body - Request body
 * @returns {object} Body đã validate
 */
export const validateUpdateRolePermissions = (body) => {
  return updateRolePermissionsSchema.parse(body);
};
