import { z } from "zod";
import { idSchema, paginationLargeSchema } from "../commonSchema.js";
import { PLACE_IMAGE_LIMITS } from "../../../config/constants.js";

const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PHONE_REGEX = /^[0-9]{10,11}$/;
const BASE64_IMAGE_REGEX = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;

const trimAndEmptyToNull = (val) => {
  if (val === undefined || val === null) return null;
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed === "" ? null : trimmed;
  }
  return val;
};

const PRICE_RANGE_VALUES = [
  "FREE",
  "BUDGET",
  "MODERATE",
  "EXPENSIVE",
  "LUXURY",
];

const placeImageBaseSchema = z.object({
  caption: z.string().max(200).optional().nullable(),
  order: z.number().int().min(0).default(0),
  isCover: z.boolean().default(false),
});

export const placeImageCreateSchema = placeImageBaseSchema.extend({
  imageData: z
    .string({
      required_error: "Dữ liệu ảnh không được để trống",
      invalid_type_error: "Dữ liệu ảnh phải là chuỗi base64",
    })
    .min(100, "Dữ liệu ảnh không hợp lệ (quá ngắn)")
    .regex(BASE64_IMAGE_REGEX, "Dữ liệu ảnh phải là base64 hợp lệ"),
});

export const placeImageExistingSchema = placeImageBaseSchema.extend({
  id: z.number().int().positive(),
  imageData: z.string().optional().nullable(),
});

export const placeImageUpdateSchema = z.union([
  placeImageCreateSchema,
  placeImageExistingSchema,
]);

export const placeImageSchema = placeImageCreateSchema;

export const openingHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isClosed: z.boolean().default(false),
  openTime: z.string().regex(TIME_REGEX).optional().nullable(),
  closeTime: z.string().regex(TIME_REGEX).optional().nullable(),
  breakStart: z.string().regex(TIME_REGEX).optional().nullable(),
  breakEnd: z.string().regex(TIME_REGEX).optional().nullable(),
  note: z.string().max(100).optional().nullable(),
});

export const amenitySchema = z.object({
  amenityType: z.string().min(1).max(50),
  amenityValue: z.string().max(200).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
});

const spokenGuideFaqSchema = z.object({
  question: z.string().trim().max(200),
  answer: z.string().trim().max(2000),
});

export const spokenGuideSchema = z
  .object({
    locale: z.string().trim().max(20).default("vi-VN"),
    text: z.string().trim().max(5000).default(""),
    faqs: z.array(spokenGuideFaqSchema).max(5).default([]),
  })
  .nullable();

export const createPlaceSchema = z.object({
  name: z
    .string({ required_error: "Tên địa điểm không được để trống" })
    .min(3, "Tên địa điểm phải có ít nhất 3 ký tự")
    .max(200, "Tên địa điểm không được quá 200 ký tự"),

  slug: z
    .string({ required_error: "Slug không được để trống" })
    .min(3)
    .max(200)
    .regex(SLUG_REGEX, "Slug chỉ được chứa chữ thường, số và dấu gạch ngang"),

  description: z.string().max(5000).optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),

  categoryId: z
    .number({
      required_error: "Danh mục không được để trống",
      invalid_type_error: "Danh mục phải là số",
    })
    .int()
    .positive(),

  districtId: z
    .number({ required_error: "Quận/Huyện không được để trống" })
    .int()
    .positive(),

  wardId: z.number().int().positive().optional().nullable(),

  address: z
    .string({ required_error: "Địa chỉ không được để trống" })
    .min(5, "Địa chỉ phải có ít nhất 5 ký tự")
    .max(500),

  latitude: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : val),
    z.coerce
      .number({
        required_error: "Vĩ độ không được để trống",
        invalid_type_error: "Vĩ độ phải là một số thực hợp lệ",
      })
      .min(8, "Vĩ độ không hợp lệ (Cần Thơ: 9-11)")
      .max(11, "Vĩ độ không hợp lệ (Cần Thơ: 9-11)")
  ),

  longitude: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : val),
    z.coerce
      .number({
        required_error: "Kinh độ không được để trống",
        invalid_type_error: "Kinh độ phải là một số thực hợp lệ",
      })
      .min(104, "Kinh độ không hợp lệ (Cần Thơ: 104-106)")
      .max(107, "Kinh độ không hợp lệ (Cần Thơ: 104-106)")
  ),

  phone: z
    .preprocess(trimAndEmptyToNull, z.string().regex(PHONE_REGEX, "Số điện thoại phải có 10-11 chữ số").optional().nullable())
    .nullable(),

  email: z
    .preprocess(trimAndEmptyToNull, z.string().email("Email không hợp lệ").optional().nullable())
    .nullable(),

  website: z
    .preprocess(trimAndEmptyToNull, z.string().url("Website không hợp lệ").optional().nullable())
    .nullable(),

  facebook: z
    .preprocess(trimAndEmptyToNull, z.string().max(200).optional().nullable())
    .nullable(),

  priceRange: z
    .preprocess(
      trimAndEmptyToNull,
      z.enum(PRICE_RANGE_VALUES, {
        errorMap: () => ({ message: "Mức giá không hợp lệ" }),
      }).optional().nullable()
    )
    .nullable(),

  priceFrom: z.number().int().min(0).optional().nullable(),
  priceTo: z.number().int().min(0).optional().nullable(),

  images: z
    .array(placeImageCreateSchema)
    .min(1, "Phải có ít nhất 1 hình ảnh")
    .max(
      PLACE_IMAGE_LIMITS.MAX_IMAGES,
      `Tối đa ${PLACE_IMAGE_LIMITS.MAX_IMAGES} hình ảnh`,
    ),

  openingHours: z.array(openingHourSchema).max(7).optional(),
  amenities: z.array(amenitySchema).max(20).optional(),
  tagIds: z.array(z.number().int().positive()).max(20).optional(),
  businessId: z.number().int().positive().optional().nullable(),
  spokenGuide: spokenGuideSchema.optional(),
});

export const updatePlaceSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  slug: z.string().min(3).max(200).regex(SLUG_REGEX).optional(),
  description: z.string().max(5000).optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  categoryId: z.number().int().positive().optional(),
  districtId: z.number().int().positive().optional(),
  wardId: z.number().int().positive().optional().nullable(),
  address: z.string().min(5).max(500).optional(),
  latitude: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : val),
    z.coerce.number({ invalid_type_error: "Vĩ độ phải là một số thực hợp lệ" }).min(8).max(11).optional()
  ),
  longitude: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : val),
    z.coerce.number({ invalid_type_error: "Kinh độ phải là một số thực hợp lệ" }).min(104).max(107).optional()
  ),
  phone: z
    .preprocess(trimAndEmptyToNull, z.string().regex(PHONE_REGEX, "Số điện thoại phải có 10-11 chữ số").optional().nullable())
    .nullable(),
  email: z
    .preprocess(trimAndEmptyToNull, z.string().email("Email không hợp lệ").optional().nullable())
    .nullable(),
  website: z
    .preprocess(trimAndEmptyToNull, z.string().url("Website không hợp lệ").optional().nullable())
    .nullable(),
  facebook: z
    .preprocess(trimAndEmptyToNull, z.string().max(200).optional().nullable())
    .nullable(),
  priceRange: z
    .preprocess(trimAndEmptyToNull, z.enum(PRICE_RANGE_VALUES).optional().nullable())
    .nullable(),
  priceFrom: z.number().int().min(0).optional().nullable(),
  priceTo: z.number().int().min(0).optional().nullable(),
  images: z
    .array(placeImageUpdateSchema)
    .min(1)
    .max(PLACE_IMAGE_LIMITS.MAX_IMAGES)
    .optional(),
  openingHours: z.array(openingHourSchema).max(7).optional(),
  amenities: z.array(amenitySchema).max(20).optional(),
  tagIds: z.array(z.number().int().positive()).max(20).optional(),
  status: z.enum(["pending", "approved", "rejected", "draft"]).optional(),
  spokenGuide: spokenGuideSchema.optional(),
});

export const getPlacesQuerySchema = paginationLargeSchema.extend({
  search: z.string().max(200).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  districtId: z.coerce.number().int().positive().optional(),
  wardId: z.coerce.number().int().positive().optional(),
  /** Admin: lọc địa điểm theo doanh nghiệp */
  businessId: z.coerce.number().int().positive().optional(),
  status: z
    .enum(["all", "pending", "approved", "rejected", "draft"])
    .optional(),
  priceRange: z.enum(["all", ...PRICE_RANGE_VALUES]).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  isFeatured: z.coerce.boolean().optional(),
  isVerified: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["newest", "oldest", "rating", "popular", "views", "name"])
    .default("newest"),
  limit: z.coerce.number().int().min(1).max(500).default(10),
});

export const nearbyPlacesQuerySchema = z.object({
  latitude: z.coerce
    .number({ required_error: "Vĩ độ không được để trống" })
    .min(8)
    .max(11),
  longitude: z.coerce
    .number({ required_error: "Kinh độ không được để trống" })
    .min(104)
    .max(107),
  radius: z.coerce.number().int().min(100).max(50000).default(5000),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  categoryId: z.coerce.number().int().positive().optional(),
});

const v2PlaceFiltersSchema = z.object({
  search: z.string().trim().max(200).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  districtId: z.coerce.number().int().positive().optional(),
  wardId: z.coerce.number().int().positive().optional(),
  priceRange: z.enum(["all", ...PRICE_RANGE_VALUES]).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  isFeatured: z.coerce.boolean().optional(),
  sortBy: z.enum(["newest", "oldest", "rating", "popular", "views", "name"]).default("newest"),
});

export const placeV2ListQuerySchema = v2PlaceFiltersSchema.extend({
  cursor: z.string().min(16).max(2048).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const placeV2MapQuerySchema = z.object({
  west: z.coerce.number().min(104).max(107),
  south: z.coerce.number().min(8).max(11),
  east: z.coerce.number().min(104).max(107),
  north: z.coerce.number().min(8).max(11),
  zoom: z.coerce.number().min(1).max(22),
  limit: z.coerce.number().int().min(1).max(200).default(100),
}).superRefine((value, context) => {
  if (value.west >= value.east) context.addIssue({ code: z.ZodIssueCode.custom, path: ["west"], message: "west must be smaller than east" });
  if (value.south >= value.north) context.addIssue({ code: z.ZodIssueCode.custom, path: ["south"], message: "south must be smaller than north" });
});

export const placeV2NearbyQuerySchema = z.object({
  latitude: z.coerce.number().min(8).max(11),
  longitude: z.coerce.number().min(104).max(107),
  radiusMeters: z.coerce.number().int().min(100).max(50_000).default(5_000),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  categoryId: z.coerce.number().int().positive().optional(),
});

export const approvePlaceSchema = z.object({
  status: z.enum(["approved", "rejected"], {
    required_error: "Trạng thái không được để trống",
  }),
  rejectionReason: z.string().min(10).max(1000).optional().nullable(),
});

export const placeIdParamSchema = z.object({
  id: idSchema,
});

export const placeIdAndImageIdParamSchema = z.object({
  id: idSchema,
  imageId: idSchema,
});

export const placeSlugParamSchema = z.object({
  slug: z
    .string({ required_error: "Slug không được để trống" })
    .min(3)
    .max(200)
    .regex(SLUG_REGEX, "Slug chỉ được chứa chữ thường, số và dấu gạch ngang"),
});

export const placeCheckSlugQuerySchema = z.object({
  excludeId: z.coerce.number().int().positive().optional(),
});

export const rejectPlaceSchema = z.object({
  reason: z
    .string({ required_error: "Vui lòng cung cấp lý do từ chối" })
    .trim()
    .min(1, "Vui lòng cung cấp lý do từ chối")
    .max(1000),
});

export const updatePlaceStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "draft"], {
    required_error: "Vui lòng cung cấp trạng thái mới",
  }),
});

export const toggleFeaturedSchema = z.object({
  isFeatured: z.boolean({
    required_error: "isFeatured không được để trống",
    invalid_type_error: "isFeatured phải là boolean",
  }),
});

export const addPlaceImagesSchema = z.object({
  images: z
    .array(placeImageCreateSchema)
    .min(1, "Vui lòng cung cấp danh sách ảnh")
    .max(
      PLACE_IMAGE_LIMITS.MAX_IMAGES,
      `Tối đa ${PLACE_IMAGE_LIMITS.MAX_IMAGES} hình ảnh`,
    ),
});

export const reorderPlaceImagesSchema = z.object({
  imageOrders: z
    .array(
      z.object({
        imageId: idSchema,
        order: z.number().int().min(0),
      }),
    )
    .min(1, "Vui lòng cung cấp thứ tự ảnh"),
});

export const createPlaceReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  bookingId: z.coerce.number().int().positive().optional().nullable(),
  title: z.string().trim().max(120).optional().nullable(),
  content: z.string().trim().max(2000).optional().nullable(),
  media: z
    .array(
      z.object({
        mediaData: z.string().min(1).max(900_000),
        thumbnailUrl: z.string().trim().optional().nullable(),
        mediaType: z.string().trim().min(1).max(50).default("image"),
        caption: z.string().max(200).optional().nullable(),
        order: z.number().int().min(0).optional(),
      }),
    )
    .max(3, "Chỉ được đính kèm tối đa 3 ảnh")
    .optional(),
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
  placeIdParamSchema,
  placeIdAndImageIdParamSchema,
  placeSlugParamSchema,
  placeCheckSlugQuerySchema,
  rejectPlaceSchema,
  updatePlaceStatusSchema,
  toggleFeaturedSchema,
  addPlaceImagesSchema,
  reorderPlaceImagesSchema,
  createPlaceReviewSchema,
};
