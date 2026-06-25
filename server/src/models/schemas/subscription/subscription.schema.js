import { z } from "zod";
import { paginationLargeSchema } from "../commonSchema.js";

export const upgradeSchema = z.object({
  targetPlanId: z.coerce
    .number({ required_error: "Plan đích không được để trống" })
    .int()
    .positive("Plan đích không hợp lệ"),
});

export const createPlanSchema = z.object({
  name: z
    .string({ required_error: "Tên plan không được để trống" })
    .min(2, "Tên plan phải có ít nhất 2 ký tự")
    .max(100),
  slug: z
    .string({ required_error: "Slug không được để trống" })
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số và dấu gạch ngang"),
  description: z.string().max(1000).optional().nullable(),
  priceMonthly: z
    .number({ required_error: "Giá tháng không được để trống" })
    .int()
    .min(0, "Giá tháng không được âm"),
  priceYearly: z.number().int().min(0).optional().nullable(),
  maxPlaces: z
    .number({ required_error: "Số lượng địa điểm tối đa không được để trống" })
    .int()
    .min(-1, "-1 = không giới hạn"),
  maxBookings: z
    .number({ required_error: "Số lượng booking tối đa không được để trống" })
    .int()
    .min(-1, "-1 = không giới hạn"),
  maxStaff: z
    .number({ required_error: "Số lượng nhân viên tối đa không được để trống" })
    .int()
    .min(0),
  features: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export const updatePlanSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số và dấu gạch ngang")
    .optional(),
  description: z.string().max(1000).optional().nullable(),
  priceMonthly: z.number().int().min(0).optional(),
  priceYearly: z.number().int().min(0).optional().nullable(),
  maxPlaces: z.number().int().min(-1).optional(),
  maxBookings: z.number().int().min(-1).optional(),
  maxStaff: z.number().int().min(0).optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const invoiceQuerySchema = paginationLargeSchema.extend({
  status: z
    .enum(["all", "pending", "paid", "overdue", "canceled"])
    .optional()
    .default("all"),
});

export const adminSubQuerySchema = paginationLargeSchema.extend({
  planId: z.coerce.number().int().positive().optional(),
  status: z
    .enum(["all", "active", "grace", "past_due", "canceled", "paused"])
    .optional()
    .default("all"),
  search: z.string().max(200).optional(),
});

export const adminUpdateStatusSchema = z.object({
  status: z.enum(["active", "grace", "past_due", "canceled", "paused"], {
    required_error: "Trạng thái không được để trống",
  }),
  cancelReason: z.string().max(500).optional().nullable(),
});
