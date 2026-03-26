import { z } from "zod";
import { paginationSchema } from "./commonSchema.js";
import { ROLES } from "../../config/constants.js";

const NON_ASSIGNABLE_ROLES = [ROLES.USER, ROLES.GUEST];

export const userStatusEnum = z.enum(["active", "inactive", "banned"]);

export const createUserSchema = z.object({
  email: z
    .string({ required_error: "Email không được để trống" })
    .min(1, "Email không được để trống")
    .email("Email không hợp lệ")
    .max(255, "Email quá dài")
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: "Mật khẩu không được để trống" })
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .max(100, "Mật khẩu quá dài"),

  roleId: z.coerce
    .number()
    .int()
    .positive()
    .default(ROLES.BUSINESS)
    .refine((val) => !NON_ASSIGNABLE_ROLES.includes(val), {
      message: "USER/GUEST role không thể gán qua admin",
    }),

  fullName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().max(500).optional(),
  provinceCode: z.string().optional(),
  districtCode: z.string().optional(),
});

export const updateUserSchema = z.object({
  email: z
    .string()
    .min(1, "Email không được để trống")
    .email("Email không hợp lệ")
    .toLowerCase()
    .trim()
    .optional(),

  password: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .max(100, "Mật khẩu quá dài")
    .optional(),

  status: userStatusEnum.optional(),

  roleId: z.coerce
    .number()
    .int()
    .positive()
    .refine((val) => !NON_ASSIGNABLE_ROLES.includes(val), {
      message: "USER/GUEST role không thể gán qua admin",
    })
    .optional(),

  emailVerified: z.boolean().optional(),
  fullName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().max(500).optional(),
  provinceCode: z.string().optional(),
  districtCode: z.string().optional(),
});

export const userQuerySchema = paginationSchema.extend({
  status: userStatusEnum.optional(),
  roleId: z.coerce.number().int().positive().optional(),
  search: z.string().trim().max(100).optional(),
});
