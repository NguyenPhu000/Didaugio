/**
 * PLACE VALIDATION SCHEMAS (Zod)
 * Validate request data cho Place module
 */

import { z } from "zod";
import { paginationSchema, paginationLargeSchema } from "./commonSchema.js";

// =============================================================================
// PLACE IMAGE SCHEMA
// =============================================================================

// Base Image Schema (metadata)
const placeImageBaseSchema = z.object({
  caption: z.string().max(200).optional().nullable(),
  order: z.number().int().min(0).default(0),
  isCover: z.boolean().default(false),
});

// For Creating New Images (imageData required)
export const placeImageCreateSchema = placeImageBaseSchema.extend({
  imageData: z
    .string({
      required_error: "Dữ liệu ảnh không được để trống",
      invalid_type_error: "Dữ liệu ảnh phải là chuỗi base64",
    })
    .min(100, "Dữ liệu ảnh không hợp lệ (quá ngắn)")
    .regex(
      /^data:image\/(jpeg|jpg|png|gif|webp);base64,/,
      "Dữ liệu ảnh phải là base64 hợp lệ",
    ),
});

// For Updating Existing Images (id required, imageData optional)
export const placeImageExistingSchema = placeImageBaseSchema.extend({
  id: z.number().int().positive(),
  imageData: z.string().optional().nullable(), // Optional if not changing
});

// Union for Update Place (can contain both New and Existing)
export const placeImageUpdateSchema = z.union([
  placeImageCreateSchema,
  placeImageExistingSchema,
]);

// Export for backward compatibility (though should update usages)
export const placeImageSchema = placeImageCreateSchema;

// =============================================================================
// OPENING HOURS SCHEMA
// =============================================================================

export const openingHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isClosed: z.boolean().default(false),
  openTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .nullable(),
  closeTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .nullable(),
  breakStart: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .nullable(),
  breakEnd: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .nullable(),
  note: z.string().max(100).optional().nullable(),
});

// =============================================================================
// AMENITY SCHEMA
// =============================================================================

export const amenitySchema = z.object({
  amenityType: z.string().min(1).max(50),
  amenityValue: z.string().max(200).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
});

// =============================================================================
// CREATE PLACE SCHEMA
// =============================================================================

export const createPlaceSchema = z.object({
  // Basic Info
  name: z
    .string({
      required_error: "Tên địa điểm không được để trống",
    })
    .min(3, "Tên địa điểm phải có ít nhất 3 ký tự")
    .max(200, "Tên địa điểm không được quá 200 ký tự"),

  slug: z
    .string({
      required_error: "Slug không được để trống",
    })
    .min(3)
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug chỉ được chứa chữ thường, số và dấu gạch ngang",
    ),

  description: z.string().max(5000).optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),

  // Category & Location
  categoryId: z
    .number({
      required_error: "Danh mục không được để trống",
      invalid_type_error: "Danh mục phải là số",
    })
    .int()
    .positive(),

  districtId: z
    .number({
      required_error: "Quận/Huyện không được để trống",
    })
    .int()
    .positive(),

  wardId: z.number().int().positive().optional().nullable(),

  address: z
    .string({
      required_error: "Địa chỉ không được để trống",
    })
    .min(5, "Địa chỉ phải có ít nhất 5 ký tự")
    .max(500),

  latitude: z
    .number({
      required_error: "Vĩ độ không được để trống",
    })
    .min(8, "Vĩ độ không hợp lệ (Cần Thơ: 9-11)")
    .max(11, "Vĩ độ không hợp lệ (Cần Thơ: 9-11)"),

  longitude: z
    .number({
      required_error: "Kinh độ không được để trống",
    })
    .min(104, "Kinh độ không hợp lệ (Cần Thơ: 104-106)")
    .max(107, "Kinh độ không hợp lệ (Cần Thơ: 104-106)"),

  // Contact
  phone: z
    .string()
    .regex(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số")
    .optional()
    .nullable(),

  email: z.string().email("Email không hợp lệ").optional().nullable(),
  website: z.string().url("Website không hợp lệ").optional().nullable(),
  facebook: z.string().max(200).optional().nullable(),

  // Price
  priceRange: z
    .enum(["FREE", "BUDGET", "MODERATE", "EXPENSIVE", "LUXURY"], {
      errorMap: () => ({ message: "Mức giá không hợp lệ" }),
    })
    .optional()
    .nullable(),

  priceFrom: z.number().int().min(0).optional().nullable(),
  priceTo: z.number().int().min(0).optional().nullable(),

  // Images (required)
  images: z
    .array(placeImageCreateSchema)
    .min(1, "Phải có ít nhất 1 hình ảnh")
    .max(10, "Tối đa 10 hình ảnh"),

  // Opening Hours (optional)
  openingHours: z.array(openingHourSchema).max(7).optional(),

  // Amenities (optional)
  amenities: z.array(amenitySchema).max(20).optional(),

  // Tags (optional)
  tagIds: z.array(z.number().int().positive()).max(20).optional(),

  // Business (optional)
  businessId: z.number().int().positive().optional().nullable(),
});

// =============================================================================
// UPDATE PLACE SCHEMA (Tất cả field đều optional)
// =============================================================================

export const updatePlaceSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  slug: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  description: z.string().max(5000).optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  categoryId: z.number().int().positive().optional(),
  districtId: z.number().int().positive().optional(),
  wardId: z.number().int().positive().optional().nullable(),
  address: z.string().min(5).max(500).optional(),
  latitude: z.number().min(8).max(11).optional(),
  longitude: z.number().min(104).max(107).optional(),
  phone: z
    .string()
    .regex(/^[0-9]{10,11}$/)
    .optional()
    .nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().url().optional().nullable(),
  facebook: z.string().max(200).optional().nullable(),
  priceRange: z
    .enum(["FREE", "BUDGET", "MODERATE", "EXPENSIVE", "LUXURY"])
    .optional()
    .nullable(),
  priceFrom: z.number().int().min(0).optional().nullable(),
  priceTo: z.number().int().min(0).optional().nullable(),
  images: z.array(placeImageUpdateSchema).min(1).max(10).optional(),
  openingHours: z.array(openingHourSchema).max(7).optional(),
  amenities: z.array(amenitySchema).max(20).optional(),
  tagIds: z.array(z.number().int().positive()).max(20).optional(),
  status: z.enum(["pending", "approved", "rejected", "draft"]).optional(),
});

// =============================================================================
// GET PLACES QUERY SCHEMA
// =============================================================================

export const getPlacesQuerySchema = paginationLargeSchema.extend({
  search: z.string().max(200).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  districtId: z.coerce.number().int().positive().optional(),
  wardId: z.coerce.number().int().positive().optional(),
  status: z
    .enum(["all", "pending", "approved", "rejected", "draft"])
    .optional(),
  priceRange: z
    .enum(["all", "FREE", "BUDGET", "MODERATE", "EXPENSIVE", "LUXURY"])
    .optional(),
  isFeatured: z.coerce.boolean().optional(),
  isVerified: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["newest", "oldest", "rating", "views", "name"])
    .default("newest"),
  // Override pagination limit — map view needs all approved places at once
  limit: z.coerce.number().int().min(1).max(500).default(10),
});

// =============================================================================
// NEARBY PLACES QUERY SCHEMA
// =============================================================================

export const nearbyPlacesQuerySchema = z.object({
  latitude: z.coerce
    .number({
      required_error: "Vĩ độ không được để trống",
    })
    .min(8)
    .max(11),

  longitude: z.coerce
    .number({
      required_error: "Kinh độ không được để trống",
    })
    .min(104)
    .max(107),

  radius: z.coerce.number().int().min(100).max(50000).default(5000), // meters
  limit: z.coerce.number().int().min(1).max(50).default(10),
  categoryId: z.coerce.number().int().positive().optional(),
});

// =============================================================================
// APPROVE/REJECT PLACE SCHEMA
// =============================================================================

export const approvePlaceSchema = z.object({
  status: z.enum(["approved", "rejected"], {
    required_error: "Trạng thái không được để trống",
  }),
  rejectionReason: z.string().min(10).max(1000).optional().nullable(),
});

export default {
  placeImageSchema,
  placeImageCreateSchema,
  placeImageUpdateSchema,
  openingHourSchema,
  amenitySchema,
  createPlaceSchema,
  updatePlaceSchema,
  getPlacesQuerySchema,
  nearbyPlacesQuerySchema,
  approvePlaceSchema,
};
