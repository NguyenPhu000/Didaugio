import { z } from "zod";
import { idSchema } from "../commonSchema.js";

export const tagGroupIdParamSchema = z.object({
  id: idSchema,
});

export const createTagGroupSchema = z.object({
  slug: z
    .string({ required_error: "Slug không được để trống" })
    .trim()
    .min(1)
    .max(120),
  nameVi: z
    .string({ required_error: "Tên tiếng Việt không được để trống" })
    .trim()
    .min(1)
    .max(120),
  nameEn: z.string().trim().min(1).max(120).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const updateTagGroupSchema = z
  .object({
    slug: z.string().trim().min(1).max(120).optional(),
    nameVi: z.string().trim().min(1).max(120).optional(),
    nameEn: z.string().trim().min(1).max(120).optional().nullable(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Không có dữ liệu để cập nhật",
  });
