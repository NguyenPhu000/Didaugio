import { z } from "zod";

// Password must contain: uppercase, lowercase, digit, and special character
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export const loginSchema = z
  .object({
    email: z
      .string()
      .email("Email không hợp lệ")
      .toLowerCase()
      .trim()
      .optional(),

    username: z
      .string()
      .min(3, "Username phải có ít nhất 3 ký tự")
      .max(30, "Username tối đa 30 ký tự")
      .trim()
      .optional(),

    password: z
      .string({ required_error: "Mật khẩu không được để trống" })
      .min(1, "Mật khẩu không được để trống")
      .max(128, "Mật khẩu quá dài"),

    deviceId: z.string().optional(),
    deviceName: z.string().optional(),
    rememberMe: z.boolean().optional().default(false),
  })
  .refine((data) => data.email || data.username, {
    message: "Vui lòng nhập email hoặc username",
    path: ["email"],
  });

export const registerSchema = z
  .object({
    email: z
      .string({ required_error: "Email không được để trống" })
      .min(1, "Email không được để trống")
      .email("Email không hợp lệ")
      .toLowerCase()
      .trim(),

    username: z
      .string({ required_error: "Username không được để trống" })
      .min(3, "Username phải có ít nhất 3 ký tự")
      .max(30, "Username toi da 30 ky tu")
      .trim()
      .regex(
        USERNAME_REGEX,
        "Username chỉ được chứa chữ cái, số và dấu gạch dưới",
      ),

    password: z
      .string({ required_error: "Mật khẩu không được để trống" })
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .max(100, "Mật khẩu quá dài")
      .regex(
        PASSWORD_REGEX,
        "Mật khẩu phải có ít nhất: 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (!@#$%^&*...)",
      ),

    confirmPassword: z
      .string({ required_error: "Xác nhận mật khẩu không được để trống" })
      .min(1, "Xác nhận mật khẩu không được để trống"),

    fullName: z
      .string()
      .min(2, "Họ tên phải có ít nhất 2 ký tự")
      .max(100, "Họ tên quá dài")
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: "Mật khẩu hiện tại không được để trống" })
      .min(1, "Mật khẩu hiện tại không được để trống")
      .max(128, "Mật khẩu quá dài"),

    newPassword: z
      .string({ required_error: "Mật khẩu mới không được để trống" })
      .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự")
      .max(100, "Mật khẩu quá dài")
      .regex(
        PASSWORD_REGEX,
        "Mật khẩu phải có ít nhất: 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (!@#$%^&*...)",
      ),

    confirmPassword: z
      .string({ required_error: "Xác nhận mật khẩu không được để trống" })
      .min(1, "Xác nhận mật khẩu không được để trống"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: "Refresh token không được để trống" })
    .min(1, "Refresh token không được để trống"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email không được để trống" })
    .min(1, "Email không được để trống")
    .email("Email không hợp lệ")
    .toLowerCase()
    .trim(),
});

export const resetPasswordSchema = z
  .object({
    token: z
      .string({ required_error: "Token không được để trống" })
      .min(1, "Token không được để trống"),

    newPassword: z
      .string({ required_error: "Mật khẩu mới không được để trống" })
      .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự")
      .max(100, "Mật khẩu quá dài")
      .regex(
        PASSWORD_REGEX,
        "Mật khẩu phải có ít nhất: 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (!@#$%^&*...)",
      ),

    confirmPassword: z
      .string({ required_error: "Xác nhận mật khẩu không được để trống" })
      .min(1, "Xác nhận mật khẩu không được để trống"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export const verifyEmailSchema = z.object({
  token: z
    .string({ required_error: "Token không được để trống" })
    .min(1, "Token không được để trống"),
});

export const resendVerificationPublicSchema = z.object({
  email: z
    .string({ required_error: "Email không được để trống" })
    .min(1, "Email không được để trống")
    .email("Email không hợp lệ")
    .toLowerCase()
    .trim(),
});

export const loginGoogleSchema = z.object({
  idToken: z
    .string({ required_error: "idToken không được để trống" })
    .min(1, "idToken không được để trống"),
  context: z.enum(["web_business"]).optional(),
});

export const logoutSchema = z.object({
  refreshToken: z
    .string({ required_error: "Refresh token không được để trống" })
    .min(1, "Refresh token không được để trống"),
});

export const revokeSessionParamSchema = z.object({
  sessionId: z.coerce
    .number()
    .int()
    .positive("sessionId phải là số nguyên dương"),
});

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username phải có ít nhất 3 ký tự")
    .max(30, "Username tối đa 30 ký tự")
    .trim()
    .regex(
      USERNAME_REGEX,
      "Username chỉ được chứa chữ cái, số và dấu gạch dưới",
    )
    .optional(),
  fullName: z.string().min(2).max(100).optional(),
  nickname: z
    .string()
    .min(2, "Nickname phải có ít nhất 2 ký tự")
    .max(50, "Nickname tối đa 50 ký tự")
    .optional()
    .nullable(),
  phone: z.string().max(20).optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(["male", "female", "other"]).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  provinceCode: z.string().max(20).optional().nullable(),
  districtCode: z.string().max(20).optional().nullable(),
});

export default {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationPublicSchema,
  loginGoogleSchema,
  logoutSchema,
  revokeSessionParamSchema,
  updateProfileSchema,
};
