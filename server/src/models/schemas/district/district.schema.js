import { z } from "zod";
import { idSchema, paginationSchema } from "../commonSchema.js";

export const districtIdParamSchema = z.object({
  id: idSchema,
});

export const districtCodeParamSchema = z.object({
  code: z.string().trim().min(1).max(20),
});

export const getDistrictsQuerySchema = z.object({
  isActive: z.coerce.boolean().optional(),
  search: z.string().trim().max(200).optional(),
});

export const getWardsByDistrictQuerySchema = z.object({
  isActive: z.coerce.boolean().optional(),
  search: z.string().trim().max(200).optional(),
  wardType: z.string().trim().max(50).optional(),
});

export const getAllWardsQuerySchema = paginationSchema.extend({
  isActive: z.coerce.boolean().optional(),
  wardType: z.string().trim().max(50).optional(),
  search: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50),
});

export const searchAddressQuerySchema = z.object({
  q: z.string().trim().min(2).max(200),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export const lookupDistrictBodySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});
