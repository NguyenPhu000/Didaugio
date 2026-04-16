import { z } from "zod";

export const createVoucherSchema = z.object({
  code: z
    .string({ required_error: "Mã voucher không được để trống" })
    .min(3, "Mã voucher phải có ít nhất 3 ký tự")
    .max(50)
    .transform((v) => v.toUpperCase()),
  name: z.string().min(2).max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  discountType: z.enum(["percentage", "fixed"], {
    required_error: "Loại giảm giá không được để trống",
  }),
  discountValue: z
    .number({ required_error: "Giá trị giảm không được để trống" })
    .min(0),
  minOrderValue: z.number().min(0).default(0),
  maxDiscount: z.number().min(0).optional().nullable(),
  maxUsage: z.number().int().min(1).default(100),
  maxUsagePerUser: z.number().int().min(1).default(1),
  applicableServices: z
    .object({
      placeIds: z.array(z.number().int().positive()).optional(),
      serviceIds: z.array(z.number().int().positive()).optional(),
    })
    .nullable()
    .optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateVoucherSchema = z.object({
  name: z.string().min(2).max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  discountType: z.enum(["percentage", "fixed"]).optional(),
  discountValue: z.number().min(0).optional(),
  minOrderValue: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional().nullable(),
  maxUsage: z.number().int().min(1).optional(),
  maxUsagePerUser: z.number().int().min(1).optional(),
  applicableServices: z
    .object({
      placeIds: z.array(z.number().int().positive()).optional(),
      serviceIds: z.array(z.number().int().positive()).optional(),
    })
    .nullable()
    .optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const bulkDeactivateSchema = z.object({
  voucherIds: z.array(z.number().int()).min(1, "Phải chọn ít nhất 1 voucher"),
});
