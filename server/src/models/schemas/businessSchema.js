import { z } from "zod";
import { paginationLargeSchema } from "./commonSchema.js";

export const registerBusinessSchema = z.object({
  businessName: z
    .string({ required_error: "Tên doanh nghiệp không được để trống" })
    .min(2, "Tên doanh nghiệp phải có ít nhất 2 ký tự")
    .max(200, "Tên doanh nghiệp không được quá 200 ký tự"),
  businessType: z.enum(["individual", "household", "company"], {
    required_error: "Loại hình doanh nghiệp không được để trống",
  }),
  taxCode: z.string().max(20).optional().nullable(),
  idCardNumber: z
    .string({ required_error: "Số CCCD không được để trống" })
    .min(9, "Số CCCD không hợp lệ")
    .max(12, "Số CCCD không hợp lệ"),
  bankName: z.string().max(100).optional().nullable(),
  bankAccountNumber: z.string().max(30).optional().nullable(),
  bankAccountOwner: z.string().max(100).optional().nullable(),
  fullName: z.string().max(120).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
});

export const updateBusinessSchema = z.object({
  businessName: z.string().min(2).max(200).optional(),
  businessType: z.enum(["individual", "household", "company"]).optional(),
  taxCode: z.string().max(20).optional().nullable(),
  idCardNumber: z.string().min(9).max(12).optional(),
  bankName: z.string().max(100).optional().nullable(),
  bankAccountNumber: z.string().max(30).optional().nullable(),
  bankAccountOwner: z.string().max(100).optional().nullable(),
  fullName: z.string().max(120).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
});

export const approveBusinessSchema = z.preprocess(
  (val) => (val === undefined || val === null ? {} : val),
  z.object({
    commissionRate: z.number().min(0).max(100).optional(),
  }),
);

export const rejectBusinessSchema = z.object({
  rejectionReason: z
    .string({ required_error: "Lý do từ chối không được để trống" })
    .min(10, "Lý do từ chối phải có ít nhất 10 ký tự")
    .max(500, "Lý do từ chối không được quá 500 ký tự"),
});

export const signBusinessContractSchema = z
  .object({
    acceptedTerms: z.literal(true).optional(),
  })
  .default({});

export const getBusinessesQuerySchema = paginationLargeSchema.extend({
  search: z.string().max(200).optional(),
  status: z
    .enum(["all", "pending", "approved", "rejected", "suspended"])
    .optional(),
  contractSigned: z.coerce.boolean().optional(),
  sortBy: z.enum(["newest", "oldest", "name"]).default("newest"),
});
