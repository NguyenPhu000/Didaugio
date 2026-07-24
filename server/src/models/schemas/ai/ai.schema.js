import { z } from "zod";

const numericCoordinateSchema = (minimum, maximum) =>
  z.preprocess(
    (value) => {
      if (typeof value === "number") return value;
      if (typeof value === "string" && value.trim() !== "") return Number(value);
      return Number.NaN;
    },
    z.number().finite().min(minimum).max(maximum),
  );

const coordinatesSchema = z.object({
  latitude: numericCoordinateSchema(-90, 90),
  longitude: numericCoordinateSchema(-180, 180),
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
  userPrompt: z.string().trim().min(1).max(500).optional(),
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

const bcp47LanguageSchema = z
  .string()
  .trim()
  .min(2)
  .max(35)
  .regex(
    /^[A-Za-z]{2,3}(?:-[A-Za-z]{4})?(?:-(?:[A-Za-z]{2}|\d{3}))?(?:-[A-Za-z0-9]{5,8})*$/,
    "language must be a bounded BCP-47 tag",
  )
  .transform((value) => value.toLowerCase());

export const aiTranscriptionFieldsSchema = z.object({
  language: bcp47LanguageSchema.optional().default("vi"),
  prompt: z.string().trim().min(1).max(1600).optional(),
});
