import { z } from "zod";
import ServiceError from "../../utils/serviceError.js";

const MAX_MONEY = 1_000_000_000;
const AI_INVALID_OUTPUT = "AI_INVALID_OUTPUT";

const monetaryValueSchema = z.number().finite().min(0).max(MAX_MONEY);
const monetaryRangeSchema = z
  .object({
    from: monetaryValueSchema,
    to: monetaryValueSchema,
  })
  .superRefine(({ from, to }, context) => {
    if (from > to) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price range minimum cannot exceed maximum.",
      });
    }
  });

const placeIdSchema = z.number().int().positive();

const hybridPlanSchema = z.object({
  tripSummary: z
    .object({
      totalEstimatedPriceFrom: monetaryValueSchema,
      totalEstimatedPriceTo: monetaryValueSchema,
      currency: z.literal("VND"),
      costBreakdown: z.object({
        food: monetaryRangeSchema,
        tickets: monetaryRangeSchema,
        transportEstimated: monetaryRangeSchema,
      }),
    })
    .superRefine(({ totalEstimatedPriceFrom, totalEstimatedPriceTo }, context) => {
      if (totalEstimatedPriceFrom > totalEstimatedPriceTo) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Total price minimum cannot exceed maximum.",
        });
      }
    }),
  timeline: z
    .array(
      z.object({
        timeSlot: z.string().trim().min(1).max(64),
        placeId: placeIdSchema,
        reason: z.string().trim().min(1).max(240),
      }),
    )
    .min(1)
    .max(6),
});

const itineraryDaysSchema = z.array(
  z
    .object({
      destinations: z.array(
        z
          .object({
            placeId: placeIdSchema,
          })
          .passthrough(),
      ),
    })
    .passthrough(),
);

export function createAiInvalidOutputError(message = "AI returned an invalid plan.") {
  const error = new ServiceError(message, 502, AI_INVALID_OUTPUT);
  error.code = AI_INVALID_OUTPUT;
  return error;
}

function getApprovedPlaceIds(places) {
  if (!Array.isArray(places)) return new Set();

  return new Set(
    places
      .map(({ id }) => Number(id))
      .filter((id) => Number.isSafeInteger(id) && id > 0),
  );
}

function assertAllowedPlaceId(placeId, approvedPlaceIds) {
  if (!approvedPlaceIds.has(placeId)) {
    throw createAiInvalidOutputError(
      "AI referenced a place outside the approved candidate set.",
    );
  }
}

/**
 * Validate and normalize the only fields hybrid planning is allowed to return.
 * Unknown model fields are discarded by Zod before the plan reaches callers.
 */
export function validateHybridPlanOutput(raw, places) {
  const result = hybridPlanSchema.safeParse(raw);
  if (!result.success) {
    throw createAiInvalidOutputError();
  }

  const approvedPlaceIds = getApprovedPlaceIds(places);
  const seenPlaceIds = new Set();

  for (const item of result.data.timeline) {
    assertAllowedPlaceId(item.placeId, approvedPlaceIds);
    if (seenPlaceIds.has(item.placeId)) {
      throw createAiInvalidOutputError("AI repeated a place in the hybrid timeline.");
    }
    seenPlaceIds.add(item.placeId);
  }

  return result.data;
}

/**
 * Keep the existing itinerary shape while ensuring every model-provided ID is
 * a numeric ID from the DB-derived candidate set. Repeating a place on another
 * day remains allowed because deterministic itinerary fallbacks rely on it.
 */
export function assertItineraryPlaceIds(days, places) {
  const result = itineraryDaysSchema.safeParse(days);
  if (!result.success) {
    throw createAiInvalidOutputError();
  }

  const approvedPlaceIds = getApprovedPlaceIds(places);
  for (const day of result.data) {
    for (const destination of day.destinations) {
      assertAllowedPlaceId(destination.placeId, approvedPlaceIds);
    }
  }

  return result.data;
}
