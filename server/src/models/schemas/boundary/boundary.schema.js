import { z } from "zod";
import { idSchema } from "../commonSchema.js";

export const boundaryDistrictCodeParamSchema = z.object({
  code: z.string().trim().min(1).max(20),
});

export const boundaryWardIdParamSchema = z.object({
  id: idSchema,
});

export const invalidateBoundaryCacheSchema = z.object({
  key: z.enum(["districts", "wards"]).optional(),
});
