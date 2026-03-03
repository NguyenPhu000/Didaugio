import { z } from "zod";
import { paginationSchema } from "./commonSchema.js";

const roleIdSchema = z.object({
  id: z.coerce.number().int().positive({
    message: "ID phải là số nguyên dương",
  }),
});

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

export const updateRolePermissionsSchema = z
  .object({
    permissionIds: z
      .array(z.number().int().positive())
      .min(0, { message: "Danh sách quyền không hợp lệ" })
      .max(100, { message: "Không thể cấp quá 100 quyền cùng lúc" }),
  })
  .strict();

export const roleUsersQuerySchema = paginationSchema.extend({
  status: z.enum(["active", "inactive", "banned", "pending"]).optional(),
  search: z.string().optional(),
});

export const validateRoleId = (id) => {
  return roleIdSchema.parse({ id }).id;
};

export const validateRoleQuery = (query) => {
  return roleQuerySchema.parse(query);
};

export const validateUpdateRolePermissions = (body) => {
  return updateRolePermissionsSchema.parse(body);
};
