import { z } from "zod";

export const notificationSettingsSchema = z.object({
  email: z
    .object({
      bookingConfirmed: z.boolean().optional(),
      bookingCancelled: z.boolean().optional(),
      bookingPending: z.boolean().optional(),
      newReview: z.boolean().optional(),
      paymentReceived: z.boolean().optional(),
      systemAlerts: z.boolean().optional(),
    })
    .optional(),
  push: z
    .object({
      bookingConfirmed: z.boolean().optional(),
      bookingCancelled: z.boolean().optional(),
      newReview: z.boolean().optional(),
      systemAlerts: z.boolean().optional(),
    })
    .optional(),
});
