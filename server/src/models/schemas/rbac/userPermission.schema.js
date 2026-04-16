import { z } from "zod";
import { idSchema, paginationSchema } from "../commonSchema.js";

export const userPermissionRoleIdParamSchema = z.object({
  roleId: idSchema,
});

export const userPermissionUserIdParamSchema = z.object({
  userId: idSchema,
});

export const userPermissionRoleUsersQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateUserCustomPermissionsSchema = z.object({
  permissionIds: z.array(idSchema).max(200),
});

export const bulkUpdateUserPermissionsSchema = z.object({
  userIds: z.array(idSchema).min(1).max(200),
  permissionIds: z.array(idSchema).max(200),
});
