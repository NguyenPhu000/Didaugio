import { z } from "zod";

const timeHmRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const ITINERARY_MONEY_MAX = 1_000_000_000;
const boundedMoneySchema = z
  .number()
  .finite()
  .min(0)
  .max(ITINERARY_MONEY_MAX);
const nullableTimeSchema = z
  .string()
  .regex(timeHmRegex, "Thoi gian phai theo dinh dang HH:mm")
  .nullable();

export const itineraryPreviewDestinationSchema = z
  .object({
    placeId: z.number().int().positive(),
    order: z.number().int().min(1).max(120),
    startTime: nullableTimeSchema,
    endTime: nullableTimeSchema,
    durationMinutes: z.number().int().min(1).max(24 * 60).nullable(),
    note: z.string().max(500).nullable(),
    transportToNext: z.string().max(100).nullable(),
    distanceToNext: z.number().finite().min(0).max(50_000).nullable().optional(),
    estimatedCost: boundedMoneySchema.nullable(),
  })
  .strict();

export const itineraryPreviewDaySchema = z
  .object({
    dayNumber: z.number().int().min(1).max(30),
    theme: z.string().trim().min(1).max(200),
    destinations: z.array(itineraryPreviewDestinationSchema).min(1).max(12),
  })
  .strict();

export const itineraryPreviewSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(1000).nullable(),
    totalDays: z.number().int().min(1).max(30),
    estimatedCost: boundedMoneySchema.nullable(),
    days: z.array(itineraryPreviewDaySchema).min(1).max(30),
  })
  .strict()
  .superRefine((draft, ctx) => {
    const seenDays = new Set();
    let destinationCount = 0;

    draft.days.forEach((day, index) => {
      destinationCount += day.destinations.length;
      if (seenDays.has(day.dayNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["days", index, "dayNumber"],
          message: "Ngay trong lich trinh khong duoc trung lap",
        });
      }
      seenDays.add(day.dayNumber);

      if (day.dayNumber > draft.totalDays) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["days", index, "dayNumber"],
          message: "Ngay vuot qua tong so ngay cua lich trinh",
        });
      }
    });

    if (destinationCount > 120) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["days"],
        message: "Lich trinh co qua nhieu dia diem",
      });
    }
  });
