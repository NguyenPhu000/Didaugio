import { z } from "zod";

const dateYmdRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeHmRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const serviceBookingParamSchema = z.object({
  serviceId: z.coerce.number().int().positive(),
});

export const createBookingSchema = z.object({
  placeId: z.coerce.number().int().positive().optional(),
  serviceId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
  useDate: z
    .string()
    .regex(dateYmdRegex, "useDate phải theo định dạng YYYY-MM-DD")
    .optional(),
  useTime: z
    .string()
    .regex(timeHmRegex, "useTime phải theo định dạng HH:mm")
    .optional(),
  bookingAt: z.string().min(8).max(64).optional(),
  guestName: z.string().min(2).max(100).optional(),
  guestPhone: z.string().min(8).max(20).optional(),
  guestEmail: z.string().email().optional(),
  tripId: z.coerce.number().int().positive().optional(),
  voucherId: z.coerce.number().int().positive().optional(),
  note: z.string().max(500).optional().nullable(),
});

export const verifyQRSchema = z.object({
  bookingCode: z.string().min(5).max(100),
  action: z.enum(["verify", "checkin"]).default("checkin"),
});

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
  businessNote: z.string().max(500).optional().nullable(),
});

export const quickRejectSchema = z.object({
  cancelReason: z.string().min(5).max(500).optional(),
  businessNote: z.string().max(500).optional().nullable(),
});

export const bookingListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.string().optional(),
  placeId: z.coerce.number().int().positive().optional(),
  businessId: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});
