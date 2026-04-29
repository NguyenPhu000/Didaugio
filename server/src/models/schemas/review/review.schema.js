import { z } from "zod";
import { paginationSchema } from "../commonSchema.js";

export const reviewStatusSchema = z.enum(["visible", "hidden", "pending", "reported"]);

export const replyReviewSchema = z.object({
  content: z
    .string({ required_error: "Nội dung phản hồi không được để trống" })
    .min(1, "Nội dung phản hồi không được để trống")
    .max(2000, "Nội dung phản hồi không được quá 2000 ký tự")
    .trim(),
});

export const updateReplySchema = z.object({
  content: z
    .string({ required_error: "Nội dung phản hồi không được để trống" })
    .min(1, "Nội dung phản hồi không được để trống")
    .max(2000, "Nội dung phản hồi không được quá 2000 ký tự")
    .trim(),
});

export const moderateReplySchema = z.object({
  status: z.enum(["visible", "hidden"], {
    required_error: "Trạng thái moderation là bắt buộc",
  }),
});

export const adminReviewQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(200).optional(),
  status: z
    .enum(["all", "visible", "hidden", "pending", "reported"])
    .optional()
    .default("all"),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  hasMedia: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const moderateReviewSchema = z.object({
  status: reviewStatusSchema,
  adminNote: z.string().trim().max(1000).optional().nullable(),
});

export const adminModerateReplySchema = z.object({
  status: z.enum(["visible", "hidden"], {
    required_error: "Trạng thái moderation là bắt buộc",
  }),
});

export const reviewIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID đánh giá không hợp lệ"),
});

export const replyIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID đánh giá không hợp lệ"),
  replyId: z.coerce.number().int().positive("ID phản hồi không hợp lệ"),
});
