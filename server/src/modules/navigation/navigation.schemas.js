import { z } from "zod";
import { aiNavigateSchema } from "../../models/schemas/routing/routing.schema.js";
import {
  NAVIGATION_EVENT_TYPES,
  NAVIGATION_MAX_BATCH_SIZE,
} from "./navigation.constants.js";

const telemetryCoordinateSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

const telemetryMetaSchema = z.object({
  platform: z.string().trim().max(48).optional(),
  appVersion: z.string().trim().max(48).optional(),
  buildNumber: z.string().trim().max(48).optional(),
  deviceId: z.string().trim().max(128).optional(),
});

const telemetryEventSchema = z.object({
  eventType: z.string().trim().min(1).max(64),
  eventAt: z.string().datetime().optional(),
  routeId: z.string().trim().max(128).optional(),
  legIndex: z.coerce.number().int().min(0).max(1000).optional(),
  location: telemetryCoordinateSchema.optional(),
  payload: z.record(z.any()).optional(),
});

export const navigationAdviceSchema = aiNavigateSchema;

export const navigationTelemetryBatchSchema = z.object({
  sessionId: z.string().trim().min(3).max(128).optional(),
  meta: telemetryMetaSchema.optional().default({}),
  events: z.array(telemetryEventSchema).min(1).max(NAVIGATION_MAX_BATCH_SIZE),
});

export const navigationTelemetrySessionParamsSchema = z.object({
  sessionId: z.string().trim().min(3).max(128),
});

export const navigationTelemetrySessionQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional().default(120),
});

export const navigationTelemetrySummaryQuerySchema = z.object({
  sinceMinutes: z.coerce
    .number()
    .int()
    .min(1)
    .max(24 * 60)
    .optional(),
  topSessions: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export const navigationTelemetryEventTypeSchema = z.enum(
  NAVIGATION_EVENT_TYPES,
);
