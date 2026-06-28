import { z } from "zod";
import { paginationLargeSchema } from "../commonSchema.js";
import {
  sanitizeNullableText,
  sanitizeOptionalText,
  sanitizeText,
} from "../../../utils/sanitizeText.js";

const sanitizeDigits = (value) => sanitizeText(value, { collapseWhitespace: false });

const sanitizeWithSchema = (
  schema,
  { nullable = false, collapseWhitespace = true } = {},
) =>
  z.preprocess(
    (value) =>
      nullable
        ? sanitizeNullableText(value, { collapseWhitespace })
        : sanitizeOptionalText(value, { collapseWhitespace }),
    schema,
  );

export const registerBusinessSchema = z.object({
  businessName: z.preprocess(
    (value) => sanitizeText(value),
    z
      .string({ required_error: "Tên doanh nghiệp không được để trống" })
      .min(2, "Tên doanh nghiệp phải có ít nhất 2 ký tự")
      .max(200, "Tên doanh nghiệp không được quá 200 ký tự"),
  ),
  businessType: z.enum(["individual", "household", "company"], {
    required_error: "Loại hình doanh nghiệp không được để trống",
  }),
  taxCode: sanitizeWithSchema(z.string().max(20).nullable().optional(), {
    nullable: true,
    collapseWhitespace: false,
  }),
  idCardNumber: z.preprocess(
    (value) => sanitizeDigits(value),
    z
      .string({ required_error: "Số CCCD không được để trống" })
      .regex(/^\d{9,12}$/, "Số CCCD không hợp lệ"),
  ),
  bankName: sanitizeWithSchema(z.string().max(100).nullable().optional(), {
    nullable: true,
  }),
  bankAccountNumber: sanitizeWithSchema(
    z
      .string()
      .max(30)
      .refine(
      (value) => value == null || /^\d{6,30}$/.test(value),
      "Số tài khoản không hợp lệ",
    )
      .nullable()
      .optional(),
    {
      nullable: true,
      collapseWhitespace: false,
    },
  ),
  bankAccountOwner: sanitizeWithSchema(
    z.string().max(100).nullable().optional(),
    { nullable: true },
  ),
  fullName: sanitizeWithSchema(z.string().max(120).nullable().optional(), {
    nullable: true,
  }),
  phone: sanitizeWithSchema(
    z
      .string()
      .max(20)
      .refine(
      (value) => value == null || /^[+\d\s().-]{8,20}$/.test(value),
      "Số điện thoại không hợp lệ",
    )
      .nullable()
      .optional(),
    {
      nullable: true,
      collapseWhitespace: false,
    },
  ),
  address: sanitizeWithSchema(z.string().max(255).nullable().optional(), {
    nullable: true,
  }),
});

export const updateBusinessSchema = z.object({
  businessName: sanitizeWithSchema(z.string().min(2).max(200).optional()),
  businessType: z.enum(["individual", "household", "company"]).optional(),
  taxCode: sanitizeWithSchema(z.string().max(20).nullable().optional(), {
    nullable: true,
    collapseWhitespace: false,
  }),
  idCardNumber: z.preprocess(
    (value) => (value === undefined ? undefined : sanitizeDigits(value)),
    z.string().regex(/^\d{9,12}$/, "Số CCCD không hợp lệ").optional(),
  ),
  bankName: sanitizeWithSchema(z.string().max(100).nullable().optional(), {
    nullable: true,
  }),
  bankAccountNumber: sanitizeWithSchema(
    z
      .string()
      .max(30)
      .refine(
      (value) => value == null || /^\d{6,30}$/.test(value),
      "Số tài khoản không hợp lệ",
    )
      .nullable()
      .optional(),
    {
      nullable: true,
      collapseWhitespace: false,
    },
  ),
  bankAccountOwner: sanitizeWithSchema(
    z.string().max(100).nullable().optional(),
    { nullable: true },
  ),
  fullName: sanitizeWithSchema(z.string().max(120).nullable().optional(), {
    nullable: true,
  }),
  phone: sanitizeWithSchema(
    z
      .string()
      .max(20)
      .refine(
      (value) => value == null || /^[+\d\s().-]{8,20}$/.test(value),
      "Số điện thoại không hợp lệ",
    )
      .nullable()
      .optional(),
    {
      nullable: true,
      collapseWhitespace: false,
    },
  ),
  address: sanitizeWithSchema(z.string().max(255).nullable().optional(), {
    nullable: true,
  }),
});

export const approveBusinessSchema = z.preprocess(
  (val) => (val === undefined || val === null ? {} : val),
  z.object({
    commissionRate: z.number().min(0).max(100).optional(),
  }),
);

export const rejectBusinessSchema = z.object({
  rejectionReason: z.preprocess(
    (value) => sanitizeText(value),
    z
      .string({ required_error: "Lý do từ chối không được để trống" })
      .min(10, "Lý do từ chối phải có ít nhất 10 ký tự")
      .max(500, "Lý do từ chối không được quá 500 ký tự"),
  ),
});

export const signBusinessContractSchema = z
  .object({
    otp: z
      .string({ required_error: "Mã OTP là bắt buộc" })
      .length(6, "Mã OTP phải có đúng 6 chữ số"),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: "Bạn cần đồng ý điều khoản hợp đồng" }),
    }),
    signatureData: z
      .string({ required_error: "Chữ ký điện tử là bắt buộc" })
      .min(64, "Dữ liệu chữ ký không hợp lệ")
      .max(5_000_000, "Dữ liệu chữ ký vượt quá giới hạn")
      .regex(
        /^data:image\/(png|jpeg|jpg);base64,/,
        "Chữ ký phải là ảnh base64",
      ),
    signedAt: z.coerce.date().optional(),
    contractVersion: z.string().max(50).optional(),
    fullName: z.string().max(100).optional(),
    phone: z.string().max(20).optional(),
    address: z.string().max(200).optional(),
    idCard: z.string().max(30).optional(),
    idCardIssuedDate: z.string().max(50).optional(),
    idCardIssuedPlace: z.string().max(100).optional(),
    signerMetadata: z
      .object({
        userAgent: z.string().max(1000).optional(),
        timezone: z.string().max(120).optional(),
        ip: z.string().max(45).optional(),
        otpVerified: z.boolean().optional(),
        phoneVerified: z.string().max(20).optional(),
      })
      .optional(),
  })
  .strict();

export const suspendBusinessSchema = z.object({
  suspensionReason: z.preprocess(
    (value) => sanitizeText(value),
    z
      .string({ required_error: "Lý do tạm khóa không được để trống" })
      .min(10, "Lý do tạm khóa phải có ít nhất 10 ký tự")
      .max(500, "Lý do tạm khóa không được quá 500 ký tự"),
  ),
});

export const terminateBusinessSchema = z.object({
  terminationReason: z.preprocess(
    (value) => sanitizeText(value),
    z
      .string({ required_error: "Lý do hủy hợp đồng không được để trống" })
      .min(10, "Lý do hủy hợp đồng phải có ít nhất 10 ký tự")
      .max(500, "Lý do hủy hợp đồng không được quá 500 ký tự"),
  ),
});

export const getBusinessesQuerySchema = paginationLargeSchema.extend({
  search: z.string().max(200).optional(),
  status: z
    .enum(["all", "pending", "approved", "rejected", "suspended", "terminated", "suspicious"])
    .optional(),
  contractSigned: z.coerce.boolean().optional(),
  sortBy: z.enum(["newest", "oldest", "name"]).default("newest"),
});
