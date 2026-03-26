import { z } from "zod";

export const confirmBookingSchema = z.object({
  note: z.string().max(500).optional().nullable(),
});

export const cancelBookingSchema = z.object({
  cancelReason: z
    .string({ required_error: "Lý do hủy không được để trống" })
    .min(5, "Lý do hủy phải có ít nhất 5 ký tự")
    .max(500),
});

export const completeBookingSchema = z.object({
  note: z.string().max(500).optional().nullable(),
});

export const bulkBookingSchema = z.object({
  bookingIds: z.array(z.number().int()).min(1, "Phải chọn ít nhất 1 booking"),
  cancelReason: z.string().min(5).max(500).optional(),
});

export const markPaidSchema = z.object({
  paymentMethod: z.string().min(2).max(50).optional(),
  transactionRef: z.string().max(255).optional().nullable(),
  amount: z.coerce.number().int().positive().optional(),
  paidAt: z.string().max(100).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export const refundBookingSchema = z.object({
  refundAmount: z.coerce
    .number({ required_error: "Số tiền hoàn là bắt buộc" })
    .int("Số tiền hoàn phải là số nguyên")
    .positive("Số tiền hoàn phải lớn hơn 0"),
  refundReason: z.string().min(5).max(500).optional().nullable(),
  refundedAt: z.string().max(100).optional().nullable(),
});

export const rescheduleBookingSchema = z.object({
  bookingTime: z.string().min(8, "bookingTime là bắt buộc (ISO 8601)"),
});

export const quickRejectSchema = z.object({
  cancelReason: z.string().max(500).optional(),
});
