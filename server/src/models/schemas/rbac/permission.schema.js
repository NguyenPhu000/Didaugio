import { z } from "zod";
import { paginationSchema } from "../commonSchema.js";

export const permissionQuerySchema = paginationSchema.extend({
  module: z.string().optional(),
  search: z.string().optional(),
  includeRoles: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional()
    .default("false"),
});

export const permissionByModuleQuerySchema = z.object({
  includeRoles: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional()
    .default("false"),
});

export const validatePermissionQuery = (query) => {
  return permissionQuerySchema.parse(query);
};

export const validatePermissionByModuleQuery = (query) => {
  return permissionByModuleQuerySchema.parse(query);
};
