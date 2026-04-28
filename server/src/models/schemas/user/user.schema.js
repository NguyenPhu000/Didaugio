import { z } from "zod";
import { paginationSchema } from "../commonSchema.js";
import { ROLES } from "../../../config/constants.js";

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

  username: z
    .string()
    .min(3, "Username phải có ít nhất 3 ký tự")
    .max(30, "Username tối đa 30 ký tự")
    .trim()
    .regex(
      /^[a-zA-Z0-9_]{3,30}$/,
      "Username chỉ được chứa chữ cái, số và dấu gạch dưới",
    )
    .optional(),

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
  nickname: z.string().min(2).max(50).optional(),
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

  username: z
    .string()
    .min(3, "Username phải có ít nhất 3 ký tự")
    .max(30, "Username tối đa 30 ký tự")
    .trim()
    .regex(
      /^[a-zA-Z0-9_]{3,30}$/,
      "Username chỉ được chứa chữ cái, số và dấu gạch dưới",
    )
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
  nickname: z.string().min(2).max(50).optional().nullable(),
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
