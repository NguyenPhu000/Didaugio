import { z } from "zod";

// =============================================================================
// USER VALIDATION SCHEMAS
// Su dung Zod de validate input truoc khi xu ly
// =============================================================================

/**
 * Schema cho ID (dung chung)
 */
export const idSchema = z.coerce
  .number({
    required_error: "ID khong duoc de trong",
    invalid_type_error: "ID phai la so",
  })
  .int("ID phai la so nguyen")
  .positive("ID phai lon hon 0");

/**
 * Schema cho pagination query params
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Schema cho tao user moi
 */
export const createUserSchema = z.object({
  email: z
    .string({
      required_error: "Email khong duoc de trong",
    })
    .min(1, "Email khong duoc de trong")
    .email("Email khong hop le")
    .max(255, "Email qua dai")
    .toLowerCase()
    .trim(),

  password: z
    .string({
      required_error: "Mat khau khong duoc de trong",
    })
    .min(6, "Mat khau phai co it nhat 6 ky tu")
    .max(100, "Mat khau qua dai"),

  roleId: z.coerce.number().int().positive().optional().default(5),
});

/**
 * Schema cho cap nhat user
 */
export const updateUserSchema = z
  .object({
    email: z
      .string()
      .email("Email khong hop le")
      .toLowerCase()
      .trim()
      .optional(),
    status: z
      .enum(["active", "inactive", "banned"], {
        errorMap: () => ({
          message: "Status khong hop le (active/inactive/banned)",
        }),
      })
      .optional(),
    roleId: z.coerce.number().int().positive().optional(),
    emailVerified: z.boolean().optional(),
  })
  .strict(); // Khong cho phep fields khong dinh nghia

/**
 * Schema cho query danh sach users
 */
export const userQuerySchema = paginationSchema.extend({
  status: z.enum(["active", "inactive", "banned"]).optional(),
  roleId: z.coerce.number().int().positive().optional(),
  search: z.string().max(100).optional(),
});
