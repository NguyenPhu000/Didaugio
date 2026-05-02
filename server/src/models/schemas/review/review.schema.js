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

const adminReviewQueryBase = paginationSchema.extend({
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
  isSeeded: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => {
      if (value === "true") return true;
      if (value === "false") return false;
      return undefined;
    }),
  queue: z.enum(["all", "needs_action"]).optional().default("all"),
  sort: z.enum(["created_desc", "priority"]).optional().default("created_desc"),
});

/** `sort=priority` chỉ áp dụng cho hàng đợi cần xử lý — tự gắn queue nếu thiếu. */
export const adminReviewQuerySchema = z.preprocess((raw) => {
  const input = raw && typeof raw === "object" ? { ...raw } : {};
  if (input.sort === "priority" && input.queue !== "needs_action") {
    input.queue = "needs_action";
  }
  return input;
}, adminReviewQueryBase);

export const moderateReviewSchema = z
  .object({
    status: reviewStatusSchema,
    adminNote: z.string().trim().max(1000).optional().nullable(),
    moderationReason: z.string().trim().max(500).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (["hidden", "reported"].includes(val.status)) {
      const r = val.moderationReason?.trim();
      if (!r) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Cần nhập lý do can thiệp khi ẩn hoặc gắn cờ report",
          path: ["moderationReason"],
        });
      }
    }
  });

export const adminModerateReplySchema = z
  .object({
    status: z.enum(["visible", "hidden"], {
      required_error: "Trạng thái moderation là bắt buộc",
    }),
    moderationReason: z.string().trim().max(500).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.status === "hidden" && !(val.moderationReason && val.moderationReason.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cần lý do khi ẩn phản hồi",
        path: ["moderationReason"],
      });
    }
  });

export const reviewIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID đánh giá không hợp lệ"),
});

export const replyIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID đánh giá không hợp lệ"),
  replyId: z.coerce.number().int().positive("ID phản hồi không hợp lệ"),
});
