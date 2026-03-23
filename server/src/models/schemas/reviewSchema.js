import { z } from "zod";

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

export const reviewIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID đánh giá không hợp lệ"),
});

export const replyIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID đánh giá không hợp lệ"),
  replyId: z.coerce.number().int().positive("ID phản hồi không hợp lệ"),
});
