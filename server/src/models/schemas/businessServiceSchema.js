import { z } from "zod";

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
});
