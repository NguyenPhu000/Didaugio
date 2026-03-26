import { z } from "zod";

export const submitFeedbackSchema = z.object({
  reportType: z.string().trim().min(1, "reportType là bắt buộc"),
  title: z.string().trim().min(1, "title là bắt buộc").max(255),
  content: z.string().trim().min(1, "content là bắt buộc"),
  targetType: z.string().trim().max(100).nullable().optional(),
  targetId: z.coerce.number().int().positive().nullable().optional(),
  screenshot: z.string().trim().url().nullable().optional(),
});
