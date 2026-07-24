import { z } from "zod";

const coordinatesSchema = z.object({
  latitude: z.coerce.number().finite().min(-90).max(90),
  longitude: z.coerce.number().finite().min(-180).max(180),
});

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

const contextSchema = z
  .object({
    currentCoords: coordinatesSchema.optional(),
    currentCity: z.string().trim().max(120).optional(),
    timeOfDay: z.string().trim().max(40).optional(),
    preferences: z
      .object({
        travelStyles: z.array(z.string().max(80)).max(10).optional(),
      })
      .strip()
      .optional(),
    visitedPlaceIds: z.array(z.coerce.number().int().positive()).max(20).optional(),
    isPlaceQuery: z.boolean().optional(),
  })
  .strip();

export const aiChatSchema = z
  .object({
    messages: z.array(messageSchema).min(1).max(20),
    context: contextSchema.optional().default({}),
    stream: z.boolean().optional().default(false),
  })
  .superRefine((value, ctx) => {
    const totalLength = value.messages.reduce(
      (total, message) => total + message.content.length,
      0,
    );

    if (totalLength > 16000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["messages"],
        message: "AI message budget exceeded",
      });
    }
  });

export const aiHybridPlanSchema = z.object({
  currentCoords: coordinatesSchema,
  userPrompt: z.string().trim().min(1).max(4000).optional(),
});

export const aiPlaceSummarySchema = z.object({
  placeId: z.coerce.number().int().positive(),
  context: z
    .object({
      timeOfDay: z.string().trim().max(40).optional(),
    })
    .strip()
    .optional()
    .default({}),
});

export const aiSpeechSchema = z.object({
  input: z.string().trim().min(1).max(1600),
  voice: z.string().trim().max(80).optional(),
});
