import { z } from "zod";

const trimAndEmptyToNull = (val) => {
  if (val === undefined || val === null) return null;
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed === "" ? null : trimmed;
  }
  return val;
};

const LINK_TYPES = ["none", "url", "event", "trip"];

export const bannerIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID banner không hợp lệ"),
});

export const createBannerSchema = z.object({
  title: z
    .string({ required_error: "Tiêu đề không được để trống" })
    .min(1, "Tiêu đề không được để trống")
    .max(200, "Tiêu đề tối đa 200 ký tự"),

  description: z.preprocess(
    trimAndEmptyToNull,
    z.string().max(500, "Mô tả tối đa 500 ký tự").optional().nullable()
  ),

  image: z
    .string({ required_error: "Ảnh banner không được để trống" })
    .min(1, "Ảnh banner không được để trống")
    .max(5_000_000, "Ảnh quá lớn (tối đa 5MB)"),

  linkType: z.enum(LINK_TYPES).default("none"),

  linkValue: z.preprocess(
    trimAndEmptyToNull,
    z.string().max(500).optional().nullable()
  ),

  position: z.string().max(50).default("home"),

  priority: z.coerce.number().int().min(0).max(100).default(0),

  startDate: z
    .string({ required_error: "Ngày bắt đầu không được để trống" })
    .min(1, "Ngày bắt đầu không được để trống")
    .datetime("Ngày bắt đầu không hợp lệ (ISO format)"),

  endDate: z
    .string({ required_error: "Ngày kết thúc không được để trống" })
    .min(1, "Ngày kết thúc không được để trống")
    .datetime("Ngày kết thúc không hợp lệ (ISO format)"),

  isActive: z.coerce.boolean().default(true),
});

export const updateBannerSchema = z.object({
  title: z.string().min(1).max(200).optional(),

  description: z.preprocess(
    trimAndEmptyToNull,
    z.string().max(500).optional().nullable()
  ),

  image: z.string().max(5_000_000).optional(),

  linkType: z.enum(LINK_TYPES).optional(),

  linkValue: z.preprocess(
    trimAndEmptyToNull,
    z.string().max(500).optional().nullable()
  ),

  position: z.string().max(50).optional(),

  priority: z.coerce.number().int().min(0).max(100).optional(),

  startDate: z.string().datetime("Ngày bắt đầu không hợp lệ").optional(),

  endDate: z.string().datetime("Ngày kết thúc không hợp lệ").optional(),

  isActive: z.coerce.boolean().optional(),
});
