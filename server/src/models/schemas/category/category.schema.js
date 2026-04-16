import { z } from "zod";
import { idSchema } from "../commonSchema.js";

export const categoryIdParamSchema = z.object({
  id: idSchema,
});

export const categorySlugParamSchema = z.object({
  slug: z
    .string({ required_error: "Slug không được để trống" })
    .trim()
    .min(3)
    .max(200),
});

export const getCategoriesQuerySchema = z.object({
  parentId: z
    .union([z.coerce.number().int().positive(), z.literal("null")])
    .optional(),
  level: z.coerce.number().int().min(1).max(10).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().trim().max(200).optional(),
  format: z.enum(["flat", "tree"]).optional(),
});

export const getCategoryTreeQuerySchema = z.object({
  parentId: z.coerce.number().int().positive().optional(),
  maxLevel: z.coerce.number().int().min(1).max(10).optional(),
});

export const createCategorySchema = z.object({
  name: z
    .string({ required_error: "Tên danh mục không được để trống" })
    .trim()
    .min(1)
    .max(200),
  slug: z
    .string({ required_error: "Slug không được để trống" })
    .trim()
    .min(1)
    .max(200),
  icon: z.string().max(50).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  thumbnail: z.string().max(500).optional().nullable(),
  parentId: z.coerce.number().int().positive().optional().nullable(),
  order: z.coerce.number().int().min(0).optional(),
});

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    slug: z.string().trim().min(1).max(200).optional(),
    icon: z.string().max(50).optional().nullable(),
    color: z.string().max(20).optional().nullable(),
    description: z.string().max(1000).optional().nullable(),
    thumbnail: z.string().max(500).optional().nullable(),
    parentId: z.coerce.number().int().positive().optional().nullable(),
    order: z.coerce.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Không có dữ liệu để cập nhật",
  });

export const assignCategoryTagsSchema = z.object({
  tagIds: z.array(idSchema).max(100),
  defaultTagIds: z.array(idSchema).max(100).optional().default([]),
});
