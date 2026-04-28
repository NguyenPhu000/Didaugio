import { z } from "zod";
import { paginationLargeSchema } from "../commonSchema.js";

const base64ImageSchema = z
  .string()
  .regex(
    /^data:image\/(jpeg|jpg|png|webp);base64,/,
    "Ảnh phải ở định dạng base64 data URI hợp lệ",
  )
  .max(8_000_000, "Ảnh quá lớn");

export const createServiceSchema = z.object({
  name: z
    .string({ required_error: "Tên dịch vụ không được để trống" })
    .min(2, "Tên dịch vụ phải có ít nhất 2 ký tự")
    .max(200, "Tên dịch vụ không được quá 200 ký tự"),
  description: z.string().max(2000).optional().nullable(),
  serviceType: z
    .enum(["entry_ticket", "tour", "package", "service", "experience"])
    .default("service"),
  price: z.number({ required_error: "Giá không được để trống" }).min(0),
  discountPrice: z.number().min(0).optional().nullable(),
  duration: z.number().int().min(1).optional().nullable(),
  maxCapacity: z.number().int().min(1).optional().nullable(),
  isActive: z.boolean().default(true),
  placeId: z.number().int().optional().nullable(),
  requireDeposit: z.boolean().optional().default(false),
  depositType: z.enum(["PERCENT", "FIXED"]).optional().nullable(),
  depositAmount: z.number().min(0).optional().nullable(),
  depositRefundable: z.boolean().optional().default(true),
  depositRefundPercent: z.number().min(0).max(100).optional().nullable(),
  thumbnail: base64ImageSchema.optional().nullable(),
  images: z.array(base64ImageSchema).max(10).optional().nullable(),
});

export const updateServiceSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  serviceType: z
    .enum(["entry_ticket", "tour", "package", "service", "experience"])
    .optional(),
  price: z.number().min(0).optional(),
  discountPrice: z.number().min(0).optional().nullable(),
  duration: z.number().int().min(1).optional().nullable(),
  maxCapacity: z.number().int().min(1).optional().nullable(),
  isActive: z.boolean().optional(),
  placeId: z.number().int().optional().nullable(),
  requireDeposit: z.boolean().optional(),
  depositType: z.enum(["PERCENT", "FIXED"]).optional().nullable(),
  depositAmount: z.number().min(0).optional().nullable(),
  depositRefundable: z.boolean().optional(),
  depositRefundPercent: z.number().min(0).max(100).optional().nullable(),
  thumbnail: base64ImageSchema.optional().nullable(),
  images: z.array(base64ImageSchema).max(10).optional().nullable(),
});

export const updateServiceDepositConfigSchema = z.object({
  requireDeposit: z.boolean(),
  depositType: z.enum(["PERCENT", "FIXED"]).optional().nullable(),
  depositAmount: z.number().min(0).optional().nullable(),
  depositRefundable: z.boolean().default(true),
  depositRefundPercent: z.number().min(0).max(100).optional().nullable(),
});

export const getBusinessServicesQuerySchema = paginationLargeSchema.extend({
  search: z.string().max(200).optional(),
  businessId: z.coerce.number().int().positive().optional(),
  placeId: z.coerce.number().int().positive().optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) =>
      v === "true" ? true : v === "false" ? false : undefined,
    ),
  serviceType: z
    .enum(["entry_ticket", "tour", "package", "service", "experience"])
    .optional(),
  sortBy: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
});
