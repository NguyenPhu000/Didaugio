import { z } from "zod";

export const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Ho ten phai co it nhat 2 ky tu")
    .max(100, "Ho ten qua dai")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(20, "So dien thoai qua dai")
    .optional()
    .or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  address: z.string().max(500, "Dia chi qua dai").optional().or(z.literal("")),
  bio: z.string().max(1000, "Gioi thieu qua dai").optional().or(z.literal("")),
});

export const userFormSchema = z.object({
  email: z
    .string()
    .min(1, "Email không được để trống")
    .email("Email không hợp lệ"),
  fullName: z.string().optional(),
  phone: z
    .string()
    .regex(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số")
    .optional()
    .or(z.literal("")),
  roleId: z.coerce.number().int().positive("Vui lòng chọn vai trò"),
  password: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  provinceCode: z.string().optional(),
  districtCode: z.string().optional(),
});
