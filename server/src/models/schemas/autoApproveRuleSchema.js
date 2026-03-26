import { z } from "zod";
import { TIME_SLOT_KEYS } from "../../utils/bookingTimeSlot.js";

const slotEnum = z.enum([
  TIME_SLOT_KEYS.MORNING,
  TIME_SLOT_KEYS.NOON,
  TIME_SLOT_KEYS.AFTERNOON,
  TIME_SLOT_KEYS.EVENING,
]);

export const autoApproveConditionsSchema = z
  .object({
    timeSlots: z.array(slotEnum).optional(),
    minQuantity: z.number().int().min(1).optional(),
    maxQuantity: z.number().int().min(1).optional(),
  })
  .strict()
  .refine(
    (c) =>
      (c.timeSlots?.length ?? 0) > 0 ||
      c.minQuantity != null ||
      c.maxQuantity != null,
    { message: "Cần ít nhất một điều kiện (khung giờ hoặc số lượng)" },
  );

export const createAutoApproveRuleSchema = z.object({
  priority: z.coerce.number().int().default(0),
  conditions: autoApproveConditionsSchema,
  isActive: z.coerce.boolean().optional().default(true),
});

export const updateAutoApproveRuleSchema = z
  .object({
    priority: z.coerce.number().int().optional(),
    conditions: autoApproveConditionsSchema.optional(),
    isActive: z.coerce.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Cần ít nhất một trường cập nhật",
  });

/**
 * @param {unknown} conditions
 */
export function validateAutoApproveConditions(conditions) {
  return autoApproveConditionsSchema.parse(conditions);
}
