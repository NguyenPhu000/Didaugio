import { z } from "zod";

const dateYmdRegex = /^\d{4}-\d{2}-\d{2}$/;

export const eventIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID sự kiện không hợp lệ"),
});

export const createEventSchema = z.object({
  title: z
    .string({ required_error: "Tiêu đề sự kiện không được để trống" })
    .min(1, "Tiêu đề sự kiện không được để trống")
    .max(200, "Tiêu đề sự kiện tối đa 200 ký tự"),
  description: z.string().max(2000, "Mô tả tối đa 2000 ký tự").optional().nullable(),
  // Accept both Cloudinary URL and base64 data URI from CMS
  thumbnail: z.string().max(5000000).optional().nullable(),
  thumbnailPublicId: z.string().max(200).optional().nullable(),
  broadcastNotice: z.string().max(255).optional().nullable(),
  startDate: z
    .string({ required_error: "Ngày bắt đầu không được để trống" })
    .regex(dateYmdRegex, "Ngày bắt đầu phải theo định dạng YYYY-MM-DD"),
  endDate: z
    .string({ required_error: "Ngày kết thúc không được để trống" })
    .regex(dateYmdRegex, "Ngày kết thúc phải theo định dạng YYYY-MM-DD"),
  location: z.string().max(200).default("Cần Thơ"),
  maxParticipants: z.coerce.number().int().positive().optional().nullable(),
  isFeaturedBanner: z.boolean().default(false),
  tripId: z.coerce.number().int().positive().optional().nullable(),
  status: z.enum(["active", "inactive", "completed"]).default("active"),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  // Accept both Cloudinary URL and base64 data URI from CMS
  thumbnail: z.string().max(5000000).optional().nullable(),
  thumbnailPublicId: z.string().max(200).optional().nullable(),
  broadcastNotice: z.string().max(255).optional().nullable(),
  startDate: z
    .string()
    .regex(dateYmdRegex, "Ngày bắt đầu phải theo định dạng YYYY-MM-DD")
    .optional(),
  endDate: z
    .string()
    .regex(dateYmdRegex, "Ngày kết thúc phải theo định dạng YYYY-MM-DD")
    .optional(),
  location: z.string().max(200).optional(),
  maxParticipants: z.coerce.number().int().positive().optional().nullable(),
  isFeaturedBanner: z.boolean().optional(),
  status: z.enum(["active", "inactive", "completed"]).optional(),
  tripId: z.coerce.number().int().positive().optional().nullable(),
});

export const pingEventSchema = z.object({
  placeId: z.coerce.number().int().positive("Địa điểm ping không hợp lệ"),
});

export const createMomentSchema = z.object({
  placeId: z.coerce.number().int().positive("Địa điểm check-in không hợp lệ"),
  imageUrl: z
    .string({ required_error: "Đường dẫn ảnh là bắt buộc" })
    .min(1, "Đường dẫn ảnh không được để trống")
    .max(5000000),
  imagePublicId: z.string().max(200).optional().nullable(),
});

export const updateBroadcastSchema = z.object({
  broadcastNotice: z.string().max(255, "Thông báo tối đa 255 ký tự").optional().nullable(),
});
