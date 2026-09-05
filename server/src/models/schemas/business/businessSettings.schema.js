import { z } from "zod";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const dayHoursSchema = z.object({
  open: timeSchema,
  close: timeSchema,
  closed: z.boolean(),
});

const operatingHoursSchema = z.object({
  monday: dayHoursSchema.optional(),
  tuesday: dayHoursSchema.optional(),
  wednesday: dayHoursSchema.optional(),
  thursday: dayHoursSchema.optional(),
  friday: dayHoursSchema.optional(),
  saturday: dayHoursSchema.optional(),
  sunday: dayHoursSchema.optional(),
});

export const updateBusinessSettingsSchema = z.object({
  general: z
    .object({
      displayName: z.string().max(200).optional(),
      description: z.string().max(2000).optional(),
      logoUrl: z.string().url().or(z.literal("")).optional(),
      contactPhone: z.string().max(50).optional(),
      contactEmail: z.string().email().or(z.literal("")).optional(),
      address: z.string().max(500).optional(),
      operatingHours: operatingHoursSchema.optional(),
    })
    .optional(),
  bookingRules: z
    .object({
      maxAdvanceDays: z.coerce.number().int().min(1).max(365).optional(),
      minLeadMinutes: z.coerce.number().int().min(0).max(1440).optional(),
      allowOverbooking: z.boolean().optional(),
      autoApprove: z.boolean().optional(),
      cancellationWindowHours: z.coerce.number().int().min(0).max(720).optional(),
      noShowPolicy: z
        .enum(["none", "charge_25", "charge_50", "charge_100", "ban_user"])
        .optional(),
    })
    .optional(),
  notifications: z
    .object({
      newBookingEmail: z.boolean().optional(),
      newBookingPush: z.boolean().optional(),
      newReviewEmail: z.boolean().optional(),
      newReviewPush: z.boolean().optional(),
      bookingCancelledEmail: z.boolean().optional(),
      cancellationEmail: z.boolean().optional(),
      cancellationPush: z.boolean().optional(),
      payoutEmail: z.boolean().optional(),
    })
    .optional(),
});
