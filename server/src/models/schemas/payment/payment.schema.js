import { z } from "zod";

export const checkoutSchema = z.object({
  bookingId: z.coerce.number().int().positive("bookingId không hợp lệ"),
  paymentMethod: z.enum(["VNPAY", "MOMO", "SEPAY", "vnpay", "momo", "sepay"], {
    errorMap: () => ({ message: "paymentMethod phải là VNPAY, MOMO hoặc SEPAY" }),
  }),
  ipAddress: z
    .string()
    .regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})\.){3}(?:25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})$|^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$/,
      "IP không hợp lệ"
    )
    .optional(),
});

export const refundPaymentSchema = z.object({
  amount: z.number().positive("Số tiền phải lớn hơn 0").optional(),
  reason: z
    .string()
    .max(500, "Lý do tối đa 500 ký tự")
    .optional()
    .default("Hoàn tiền theo yêu cầu quản trị viên"),
  idempotencyKey: z
    .string()
    .trim()
    .min(1)
    .max(128)
    .optional()
    .default(() => `refund_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`),
});

export const initiateSePayRefundSchema = z.object({
  amount: z.number().int().positive("Số tiền phải lớn hơn 0").optional(),
  reason: z
    .string()
    .max(500, "Lý do tối đa 500 ký tự")
    .optional()
    .default("Hoàn tiền SePay theo yêu cầu"),
  idempotencyKey: z
    .string()
    .trim()
    .min(1)
    .max(128)
    .optional()
    .default(() => `sepay_refund_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`),
});

export const recoverPendingRefundSchema = z.object({
  refundAttemptId: z.number().int().positive("refundAttemptId không hợp lệ"),
});

export const rejectRefundSchema = z.object({
  reason: z.string().min(5, "Lý do tối thiểu 5 ký tự").max(500, "Lý do tối đa 500 ký tự"),
});
