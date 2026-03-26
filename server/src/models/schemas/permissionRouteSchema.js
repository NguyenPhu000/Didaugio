import { z } from "zod";
import { paginationSchema } from "./commonSchema.js";

export const permissionListQuerySchemaRoute = paginationSchema.extend({
  module: z.string().trim().max(100).optional(),
  search: z.string().trim().max(200).optional(),
  includeRoles: z.enum(["true", "false"]).optional(),
});

export const permissionByModuleQuerySchemaRoute = z.object({
  includeRoles: z.enum(["true", "false"]).optional(),
});
