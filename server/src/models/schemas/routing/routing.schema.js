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
    simplifyGeometry: z.boolean().optional(),
    simplificationToleranceMeters: z.coerce.number().min(1).max(50).optional(),
    weather: z.enum(["clear", "cloudy", "rain_light", "rain_heavy", "storm"]).optional(),
    exclude: z.string().optional(),
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

export const routingTableSchema = z.object({
  waypoints: z.array(z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  })).min(2).max(50),
  mode: z.enum(["driving", "walking", "cycling", "motorcycle"]).default("driving"),
  options: routeOptionsSchema,
});

const routeCandidateSchema = z.object({
  id: z.string(),
  distance: z.coerce.number().nonnegative(),
  duration: z.coerce.number().nonnegative(),
  summary: z.string().optional(),
  legs: z.array(z.any()).optional(),
});

export const aiNavigateSchema = z
  .object({
    origin: coordinateSchema,
    destination: coordinateSchema,
    waypoints: z.array(coordinateSchema).max(16).optional().default([]),
    routes: z.array(routeCandidateSchema).optional().default([]),
    mode: modeSchema.optional(),
    options: routeOptionsSchema,
    context: z
      .object({
        time: z.string().optional(),
        userPreference: z.string().optional(),
        vehicleType: z.string().optional(),
        question: z.string().optional(),
        intent: z.string().optional(),
      })
      .optional()
      .default({}),
  })
  .superRefine((value, ctx) => {
    if ((value.routes?.length || 0) > 0 || (value.waypoints?.length || 0) > 0) {
      return;
    }

    ctx.addIssue({
      code: "custom",
      path: ["routes"],
      message: "Cần truyền routes hoặc waypoints để phân tích điều hướng",
    });
  });
