import { z } from "zod";
import i18n from "@/i18n";

const DISCOUNT_TYPES = ["percentage", "fixed"];

export const createVoucherSchema = z
  .object({
    code: z
      .string()
      .min(1, () => i18n.t("validation.required", { field: "Mã voucher" }))
      .max(50, () => i18n.t("validation.maxLength", { field: "Mã voucher", max: 50 }))
      .regex(/^[A-Z0-9_-]+$/, () => "Mã voucher chỉ chứa chữ in hoa, số, gạch dưới và gạch ngang"),
    description: z
      .string()
      .max(500, () => i18n.t("validation.maxLength", { field: "Mô tả", max: 500 }))
      .optional()
      .or(z.literal("")),
    discountType: z.enum(DISCOUNT_TYPES, {
      errorMap: () => ({ message: "Loại giảm giá không hợp lệ" }),
    }),
    discountValue: z.coerce
      .number()
      .positive(() => "Giá trị giảm giá phải lớn hơn 0"),
    minOrderValue: z.coerce
      .number()
      .min(0, () => "Giá trị đơn hàng tối thiểu không được âm")
      .optional(),
    maxDiscountAmount: z.coerce
      .number()
      .min(0, () => "Giảm giá tối đa không được âm")
      .optional(),
    usageLimit: z.coerce
      .number()
      .int(() => "Giới hạn sử dụng phải là số nguyên")
      .positive(() => "Giới hạn sử dụng phải lớn hơn 0")
      .optional(),
    startDate: z.string().min(1, () => i18n.t("validation.required", { field: "Ngày bắt đầu" })),
    endDate: z.string().min(1, () => i18n.t("validation.required", { field: "Ngày kết thúc" })),
    applicablePlaceIds: z.array(z.number().int().positive()).optional(),
  })
  .refine((data) => {
    if (data.discountType === "percentage" && data.discountValue > 100) {
      return false;
    }
    return true;
  }, {
    message: "Phần trăm giảm giá không được vượt quá 100%",
    path: ["discountValue"],
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "Ngày kết thúc phải sau ngày bắt đầu",
    path: ["endDate"],
  });

export const updateVoucherSchema = z
  .object({
    code: z
      .string()
      .max(50, () => i18n.t("validation.maxLength", { field: "Mã voucher", max: 50 }))
      .regex(/^[A-Z0-9_-]+$/, () => "Mã voucher chỉ chứa chữ in hoa, số, gạch dưới và gạch ngang")
      .optional(),
    description: z
      .string()
      .max(500, () => i18n.t("validation.maxLength", { field: "Mô tả", max: 500 }))
      .optional()
      .or(z.literal("")),
    discountType: z.enum(DISCOUNT_TYPES).optional(),
    discountValue: z.coerce
      .number()
      .positive(() => "Giá trị giảm giá phải lớn hơn 0")
      .optional(),
    minOrderValue: z.coerce
      .number()
      .min(0, () => "Giá trị đơn hàng tối thiểu không được âm")
      .optional(),
    maxDiscountAmount: z.coerce
      .number()
      .min(0, () => "Giảm giá tối đa không được âm")
      .optional(),
    usageLimit: z.coerce
      .number()
      .int(() => "Giới hạn sử dụng phải là số nguyên")
      .positive(() => "Giới hạn sử dụng phải lớn hơn 0")
      .optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    applicablePlaceIds: z.array(z.number().int().positive()).optional(),
  })
  .refine((data) => {
    if (data.discountType === "percentage" && data.discountValue !== undefined && data.discountValue > 100) {
      return false;
    }
    return true;
  }, {
    message: "Phần trăm giảm giá không được vượt quá 100%",
    path: ["discountValue"],
  });

export const voucherFilterSchema = z.object({
  status: z.string().optional(),
  dateRange: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
    .optional(),
  placeId: z.coerce.number().int().positive().optional(),
});
