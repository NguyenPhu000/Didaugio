import { z } from "zod";

// =============================================================================
// SHARED SCHEMAS
// =============================================================================

// Schema cho pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

// =============================================================================
// PERMISSION SCHEMAS
// =============================================================================

// Schema cho query params khi lấy danh sách permissions
export const permissionQuerySchema = paginationSchema.extend({
  module: z.string().optional(),
  search: z.string().optional(),
  includeRoles: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional()
    .default("false"),
});

// Schema cho query lấy permissions theo module
export const permissionByModuleQuerySchema = z.object({
  includeRoles: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional()
    .default("false"),
});

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate query params cho danh sách permissions
 * @param {object} query - Query object từ req.query
 * @returns {object} Query đã validate và transform
 */
export const validatePermissionQuery = (query) => {
  return permissionQuerySchema.parse(query);
};

/**
 * Validate query params cho permissions by module
 * @param {object} query - Query object từ req.query
 * @returns {object} Query đã validate và transform
 */
export const validatePermissionByModuleQuery = (query) => {
  return permissionByModuleQuerySchema.parse(query);
};
