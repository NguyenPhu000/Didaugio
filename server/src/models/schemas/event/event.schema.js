import { z } from "zod";

const dateYmdRegex = /^\d{4}-\d{2}-\d{2}$/;

export const eventIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID su kien khong hop le"),
});

export const createEventSchema = z.object({
  title: z
    .string({ required_error: "Tieu de su kien khong duoc de trong" })
    .min(1, "Tieu de su kien khong duoc de trong")
    .max(200, "Tieu de su kien toi da 200 ky tu"),
  description: z.string().max(2000, "Mo ta toi da 2000 ky tu").optional().nullable(),
  thumbnail: z.string().max(5000000).optional().nullable(),
  thumbnailPublicId: z.string().max(200).optional().nullable(),
  broadcastNotice: z.string().max(255).optional().nullable(),
  startDate: z
    .string({ required_error: "Ngay bat dau khong duoc de trong" })
    .regex(dateYmdRegex, "Ngay bat dau phai theo dinh dang YYYY-MM-DD"),
  endDate: z
    .string({ required_error: "Ngay ket thuc khong duoc de trong" })
    .regex(dateYmdRegex, "Ngay ket thuc phai theo dinh dang YYYY-MM-DD"),
  location: z.string().max(200).default("Can Tho"),
  maxParticipants: z.coerce.number().int().positive().optional().nullable(),
  isFeaturedBanner: z.boolean().default(false),
  tripId: z.coerce.number().int().positive().optional().nullable(),
  status: z.enum(["active", "inactive", "completed"]).default("active"),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  thumbnail: z.string().max(5000000).optional().nullable(),
  thumbnailPublicId: z.string().max(200).optional().nullable(),
  broadcastNotice: z.string().max(255).optional().nullable(),
  startDate: z
    .string()
    .regex(dateYmdRegex, "Ngay bat dau phai theo dinh dang YYYY-MM-DD")
    .optional(),
  endDate: z
    .string()
    .regex(dateYmdRegex, "Ngay ket thuc phai theo dinh dang YYYY-MM-DD")
    .optional(),
  location: z.string().max(200).optional(),
  maxParticipants: z.coerce.number().int().positive().optional().nullable(),
  isFeaturedBanner: z.boolean().optional(),
  status: z.enum(["active", "inactive", "completed"]).optional(),
  tripId: z.coerce.number().int().positive().optional().nullable(),
});

export const pingEventSchema = z.object({
  placeId: z.coerce.number().int().positive("Dia diem ping khong hop le"),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

export const createMomentSchema = z.object({
  placeId: z.coerce.number().int().positive("Dia diem check-in khong hop le"),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  imageUrl: z
    .string({ required_error: "Duong dan anh la bat buoc" })
    .min(1, "Duong dan anh khong duoc de trong")
    .max(5000000),
  imagePublicId: z.string().max(200).optional().nullable(),
});

export const updateBroadcastSchema = z.object({
  broadcastNotice: z.string().max(255, "Thong bao toi da 255 ky tu").optional().nullable(),
});
