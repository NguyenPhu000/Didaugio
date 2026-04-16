import { z } from "zod";
import { idSchema, paginationSchema } from "../commonSchema.js";

export const roleIdParamSchema = z.object({
  id: idSchema,
});

export const roleListQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(200).optional(),
  includePermissions: z.enum(["true", "false"]).optional(),
  includeUserCount: z.enum(["true", "false"]).optional(),
});

export const roleUsersQuerySchemaRoute = paginationSchema.extend({
  status: z.enum(["active", "inactive", "banned", "pending"]).optional(),
  search: z.string().trim().max(200).optional(),
});

export const roleUpdatePermissionsBodySchema = z.object({
  permissionIds: z.array(idSchema).max(100),
});
