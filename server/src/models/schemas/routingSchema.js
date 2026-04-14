import { z } from "zod";

const coordinateSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  name: z.string().trim().max(160).optional(),
});

const modeSchema = z
  .enum(["driving", "walking", "cycling", "motorcycle"])
  .default("driving");

const routeOptionsSchema = z
  .object({
    alternatives: z.coerce.number().int().min(0).max(3).optional(),
    steps: z.boolean().optional(),
    overview: z.enum(["full", "simplified", "false"]).optional(),
    geometries: z.enum(["polyline6", "geojson"]).optional(),
    snapToRoad: z.boolean().optional(),
  })
  .optional();

export const routingCalculateSchema = z.object({
  origin: coordinateSchema,
  destination: coordinateSchema,
  waypoints: z.array(coordinateSchema).max(16).optional().default([]),
  mode: modeSchema,
  options: routeOptionsSchema,
});

export const routingLegsSchema = z.object({
  waypoints: z.array(coordinateSchema).min(2).max(25),
  mode: modeSchema,
  options: routeOptionsSchema,
});

export const aiNavigateSchema = z.object({
  origin: coordinateSchema,
  destination: coordinateSchema,
  routes: z
    .array(
      z.object({
        id: z.string(),
        distance: z.coerce.number().nonnegative(),
        duration: z.coerce.number().nonnegative(),
        summary: z.string().optional(),
        legs: z.array(z.any()).optional(),
      }),
    )
    .min(1),
  context: z
    .object({
      time: z.string().optional(),
      userPreference: z.string().optional(),
      vehicleType: z.string().optional(),
      question: z.string().optional(),
    })
    .optional()
    .default({}),
});
