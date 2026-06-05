import { z } from "zod";

const dateYmdRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeHmRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// ─── Param schemas ──────────────────────────────────────────────────────────

export const tripIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID chuyến đi không hợp lệ"),
});

export const destIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID chuyến đi không hợp lệ"),
  destId: z.coerce.number().int().positive("ID địa điểm không hợp lệ"),
});

// ─── Trip CRUD schemas ──────────────────────────────────────────────────────

export const createTripSchema = z.object({
  title: z
    .string({ required_error: "Tên chuyến đi không được để trống" })
    .min(1, "Tên chuyến đi không được để trống")
    .max(200, "Tên chuyến đi tối đa 200 ký tự"),
  description: z.string().max(1000, "Mô tả tối đa 1000 ký tự").optional().nullable(),
  startDate: z
    .string()
    .regex(dateYmdRegex, "startDate phải theo định dạng YYYY-MM-DD")
    .optional()
    .nullable(),
  endDate: z
    .string()
    .regex(dateYmdRegex, "endDate phải theo định dạng YYYY-MM-DD")
    .optional()
    .nullable(),
  totalDays: z.coerce.number().int().min(1).max(365).optional().nullable(),
  travelStyle: z.string().max(50).optional().nullable(),
  groupSize: z.coerce.number().int().min(1).max(50).optional(),
  status: z.enum(["planned"]).optional(),
  thumbnail: z.string().optional().nullable(),
  placeIds: z.array(z.coerce.number().int().positive()).optional(),
});

export const updateTripSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  startDate: z
    .string()
    .regex(dateYmdRegex, "startDate phải theo định dạng YYYY-MM-DD")
    .optional()
    .nullable(),
  endDate: z
    .string()
    .regex(dateYmdRegex, "endDate phải theo định dạng YYYY-MM-DD")
    .optional()
    .nullable(),
  totalDays: z.coerce.number().int().min(1).max(365).optional(),
  travelStyle: z.string().max(50).optional().nullable(),
  groupSize: z.coerce.number().int().min(1).max(50).optional(),
  status: z
    .enum(["planned", "upcoming", "in-progress", "completed", "cancelled"])
    .optional(),
  thumbnail: z.string().optional().nullable(),
});

// ─── Destination schemas ────────────────────────────────────────────────────

export const addDestinationSchema = z.object({
  placeId: z.coerce.number().int().positive("placeId không hợp lệ"),
  dayNumber: z.coerce.number().int().min(1).max(365).default(1),
  order: z.coerce.number().int().min(0).optional(),
  note: z.string().max(500).optional().nullable(),
  startTime: z
    .string()
    .regex(timeHmRegex, "startTime phải theo định dạng HH:mm")
    .optional()
    .nullable(),
  endTime: z
    .string()
    .regex(timeHmRegex, "endTime phải theo định dạng HH:mm")
    .optional()
    .nullable(),
  transportToNext: z.string().max(50).optional().nullable(),
  distanceToNext: z.coerce.number().min(0).optional().nullable(),
});

export const updateDestinationSchema = z.object({
  startTime: z
    .string()
    .regex(timeHmRegex, "startTime phải theo định dạng HH:mm")
    .optional()
    .nullable(),
  endTime: z
    .string()
    .regex(timeHmRegex, "endTime phải theo định dạng HH:mm")
    .optional()
    .nullable(),
  durationMinutes: z.coerce.number().int().min(0).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  transportToNext: z.string().max(50).optional().nullable(),
  distanceToNext: z.coerce.number().min(0).optional().nullable(),
});

export const moveDestinationSchema = z.object({
  newDayNumber: z.coerce.number().int().min(1).max(365),
  newOrder: z.coerce.number().int().min(0).default(0),
});

export const reorderDestinationsSchema = z.object({
  dayNumber: z.coerce.number().int().min(1).max(365),
  orderedIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "Danh sách sắp xếp không được rỗng"),
});

// ─── AI Trip Generation schema ──────────────────────────────────────────────

export const generateTripSchema = z.object({
  totalDays: z.coerce.number().int().min(1).max(30).default(1),
  travelStyle: z.string().max(50).optional(),
  groupSize: z.coerce.number().int().min(1).max(50).default(1),
  budget: z.string().max(50).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  notes: z.string().max(500).optional(),
  previewOnly: z.boolean().optional(),
  selectedPlaceIds: z.array(z.coerce.number().int().positive()).optional(),
  itineraryDraft: z.any().optional(),
});

// ─── TripShare schemas ──────────────────────────────────────────────────────

export const createTripShareSchema = z.object({
  shareType: z.enum(["view", "edit"]).default("view"),
  password: z.string().min(4).max(50).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  maxAccess: z.coerce.number().int().min(1).max(10000).optional().nullable(),
});

export const accessTripShareSchema = z.object({
  password: z.string().max(50).optional(),
});
