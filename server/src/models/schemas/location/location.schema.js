import { z } from "zod";

const administrativeCode = z.string().trim().min(1).max(20).regex(/^\d+$/u);

export const provinceCodeParamSchema = z.object({
  provinceCode: administrativeCode,
});

export const locationSearchQuerySchema = z.object({
  provinceCode: administrativeCode,
  q: z.string().trim().min(1).max(100),
});

export const locationLookupSchema = z.object({
  latitude: z.coerce.number().min(8).max(24),
  longitude: z.coerce.number().min(102).max(110),
});
