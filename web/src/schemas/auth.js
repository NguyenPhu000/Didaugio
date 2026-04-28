import { z } from "zod";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email hoặc username không được để trống"),
  password: z
    .string()
    .min(1, "Mật khẩu không được để trống")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ").toLowerCase(),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
    username: z
      .string()
      .min(3, "Username phải có ít nhất 3 ký tự")
      .max(30, "Username tối đa 30 ký tự")
      .regex(USERNAME_REGEX, "Username chỉ gồm chữ, số và dấu gạch dưới"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });
