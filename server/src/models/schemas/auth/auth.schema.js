import { z } from "zod";

// Password must contain: uppercase, lowercase, digit, and special character
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export const loginSchema = z
  .object({
    email: z
      .string()
      .email("Email khong hop le")
      .toLowerCase()
      .trim()
      .optional(),

    username: z
      .string()
      .min(3, "Username phai co it nhat 3 ky tu")
      .max(30, "Username toi da 30 ky tu")
      .trim()
      .optional(),

    password: z
      .string({ required_error: "Mat khau khong duoc de trong" })
      .min(1, "Mat khau khong duoc de trong")
      .max(128, "Mat khau qua dai"),

    deviceId: z.string().optional(),
    deviceName: z.string().optional(),
  })
  .refine((data) => data.email || data.username, {
    message: "Vui long nhap email hoac username",
    path: ["email"],
  });

export const registerSchema = z
  .object({
    email: z
      .string({ required_error: "Email khong duoc de trong" })
      .min(1, "Email khong duoc de trong")
      .email("Email khong hop le")
      .toLowerCase()
      .trim(),

    username: z
      .string({ required_error: "Username khong duoc de trong" })
      .min(3, "Username phai co it nhat 3 ky tu")
      .max(30, "Username toi da 30 ky tu")
      .trim()
      .regex(
        USERNAME_REGEX,
        "Username chi duoc chua chu cai, so va dau gach duoi",
      ),

    password: z
      .string({ required_error: "Mat khau khong duoc de trong" })
      .min(8, "Mat khau phai co it nhat 8 ky tu")
      .max(100, "Mat khau qua dai")
      .regex(
        PASSWORD_REGEX,
        "Mat khau phai co it nhat: 1 chu hoa, 1 chu thuong, 1 so va 1 ky tu dac biet (!@#$%^&*...)",
      ),

    confirmPassword: z
      .string({ required_error: "Xac nhan mat khau khong duoc de trong" })
      .min(1, "Xac nhan mat khau khong duoc de trong"),

    fullName: z
      .string()
      .min(2, "Ho ten phai co it nhat 2 ky tu")
      .max(100, "Ho ten qua dai")
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mat khau xac nhan khong khop",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: "Mat khau hien tai khong duoc de trong" })
      .min(1, "Mat khau hien tai khong duoc de trong")
      .max(128, "Mat khau qua dai"),

    newPassword: z
      .string({ required_error: "Mat khau moi khong duoc de trong" })
      .min(8, "Mat khau moi phai co it nhat 8 ky tu")
      .max(100, "Mat khau qua dai")
      .regex(
        PASSWORD_REGEX,
        "Mat khau phai co it nhat: 1 chu hoa, 1 chu thuong, 1 so va 1 ky tu dac biet (!@#$%^&*...)",
      ),

    confirmPassword: z
      .string({ required_error: "Xac nhan mat khau khong duoc de trong" })
      .min(1, "Xac nhan mat khau khong duoc de trong"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mat khau xac nhan khong khop",
    path: ["confirmPassword"],
  });

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: "Refresh token khong duoc de trong" })
    .min(1, "Refresh token khong duoc de trong"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email khong duoc de trong" })
    .min(1, "Email khong duoc de trong")
    .email("Email khong hop le")
    .toLowerCase()
    .trim(),
});

export const resetPasswordSchema = z
  .object({
    token: z
      .string({ required_error: "Token khong duoc de trong" })
      .min(1, "Token khong duoc de trong"),

    newPassword: z
      .string({ required_error: "Mat khau moi khong duoc de trong" })
      .min(8, "Mat khau moi phai co it nhat 8 ky tu")
      .max(100, "Mat khau qua dai")
      .regex(
        PASSWORD_REGEX,
        "Mat khau phai co it nhat: 1 chu hoa, 1 chu thuong, 1 so va 1 ky tu dac biet (!@#$%^&*...)",
      ),

    confirmPassword: z
      .string({ required_error: "Xac nhan mat khau khong duoc de trong" })
      .min(1, "Xac nhan mat khau khong duoc de trong"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mat khau xac nhan khong khop",
    path: ["confirmPassword"],
  });

export const verifyEmailSchema = z.object({
  token: z
    .string({ required_error: "Token khong duoc de trong" })
    .min(1, "Token khong duoc de trong"),
});

export const resendVerificationPublicSchema = z.object({
  email: z
    .string({ required_error: "Email khong duoc de trong" })
    .min(1, "Email khong duoc de trong")
    .email("Email khong hop le")
    .toLowerCase()
    .trim(),
});

export const loginGoogleSchema = z.object({
  idToken: z
    .string({ required_error: "idToken khong duoc de trong" })
    .min(1, "idToken khong duoc de trong"),
});

export const logoutSchema = z.object({
  refreshToken: z
    .string({ required_error: "Refresh token khong duoc de trong" })
    .min(1, "Refresh token khong duoc de trong"),
});

export const revokeSessionParamSchema = z.object({
  sessionId: z.coerce
    .number()
    .int()
    .positive("sessionId phai la so nguyen duong"),
});

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username phai co it nhat 3 ky tu")
    .max(30, "Username toi da 30 ky tu")
    .trim()
    .regex(
      USERNAME_REGEX,
      "Username chi duoc chua chu cai, so va dau gach duoi",
    )
    .optional(),
  fullName: z.string().min(2).max(100).optional(),
  nickname: z
    .string()
    .min(2, "Nickname phai co it nhat 2 ky tu")
    .max(50, "Nickname toi da 50 ky tu")
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
