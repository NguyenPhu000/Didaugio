import { z } from "zod";

export const updateBusinessSettingsSchema = z.object({
  general: z
    .object({
      displayName: z.string().max(200).optional(),
      description: z.string().max(2000).optional(),
      logoUrl: z.string().url().or(z.literal("")).optional(),
    })
    .optional(),
  bookingRules: z
    .object({
      maxAdvanceDays: z.coerce.number().int().min(1).max(365).optional(),
      minLeadMinutes: z.coerce.number().int().min(0).max(1440).optional(),
      allowOverbooking: z.boolean().optional(),
      autoApprove: z.boolean().optional(),
    })
    .optional(),
  notifications: z
    .object({
      newBookingEmail: z.boolean().optional(),
      newBookingPush: z.boolean().optional(),
      newReviewEmail: z.boolean().optional(),
      newReviewPush: z.boolean().optional(),
      bookingCancelledEmail: z.boolean().optional(),
    })
    .optional(),
});
