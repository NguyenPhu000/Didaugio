import { z } from "zod";

export const createBlockedDateSchema = z.object({
  serviceId: z.coerce.number().int().positive().nullable().optional(),
  date: z.coerce.date(),
  reason: z.string().max(500).optional(),
});

export const blockedDateQuerySchema = z.object({
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  serviceId: z.coerce.number().int().positive().optional(),
});
