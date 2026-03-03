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
