import { z } from "zod";
import { idSchema } from "../commonSchema.js";

const TAG_TYPES = [
  "general",
  "feature",
  "amenity",
  "cuisine",
  "activity",
  "atmosphere",
];

export const tagIdParamSchema = z.object({
  id: idSchema,
});

export const tagSlugParamSchema = z.object({
  slug: z
    .string({ required_error: "Slug không được để trống" })
    .trim()
    .min(1)
    .max(200),
});

export const tagSuggestParamSchema = z.object({
  categoryId: idSchema,
});

export const getTagsQuerySchema = z.object({
  tagType: z.enum(TAG_TYPES).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().trim().max(200).optional(),
  sortBy: z.enum(["usageCount", "name", "newest"]).optional(),
});

export const getPopularTagsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  tagType: z.enum(TAG_TYPES).optional(),
});

export const createTagSchema = z.object({
  name: z
    .string({ required_error: "Tên tag không được để trống" })
    .trim()
    .min(1)
    .max(120),
  slug: z
    .string({ required_error: "Slug không được để trống" })
    .trim()
    .min(1)
    .max(120),
  tagType: z.enum(TAG_TYPES).optional(),
  icon: z.string().max(50).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
});

export const updateTagSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    slug: z.string().trim().min(1).max(120).optional(),
    tagType: z.enum(TAG_TYPES).optional(),
    icon: z.string().max(50).optional().nullable(),
    color: z.string().max(20).optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Không có dữ liệu để cập nhật",
  });

export const bulkCreateTagsSchema = z.object({
  tags: z.array(createTagSchema).min(1).max(100),
});
