import { z } from "zod";

/**
 * Schema cho dang nhap
 */
export const loginSchema = z.object({
  email: z
    .string({
      required_error: "Email khong duoc de trong",
    })
    .min(1, "Email khong duoc de trong")
    .email("Email khong hop le")
    .toLowerCase()
    .trim(),

  password: z
    .string({
      required_error: "Mat khau khong duoc de trong",
    })
    .min(1, "Mat khau khong duoc de trong"),

  // Optional device info
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
});

/**
 * Schema cho dang ky
 */
export const registerSchema = z
  .object({
    email: z
      .string({
        required_error: "Email khong duoc de trong",
      })
      .min(1, "Email khong duoc de trong")
      .email("Email khong hop le")
      .toLowerCase()
      .trim(),

    password: z
      .string({
        required_error: "Mat khau khong duoc de trong",
      })
      .min(6, "Mat khau phai co it nhat 6 ky tu")
      .max(100, "Mat khau qua dai")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Mat khau phai co it nhat 1 chu hoa, 1 chu thuong va 1 so"
      ),

    confirmPassword: z
      .string({
        required_error: "Xac nhan mat khau khong duoc de trong",
      })
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

/**
 * Schema cho doi mat khau
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({
        required_error: "Mat khau hien tai khong duoc de trong",
      })
      .min(1, "Mat khau hien tai khong duoc de trong"),

    newPassword: z
      .string({
        required_error: "Mat khau moi khong duoc de trong",
      })
      .min(6, "Mat khau moi phai co it nhat 6 ky tu")
      .max(100, "Mat khau qua dai")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Mat khau phai co it nhat 1 chu hoa, 1 chu thuong va 1 so"
      ),

    confirmPassword: z
      .string({
        required_error: "Xac nhan mat khau khong duoc de trong",
      })
      .min(1, "Xac nhan mat khau khong duoc de trong"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mat khau xac nhan khong khop",
    path: ["confirmPassword"],
  });

/**
 * Schema cho refresh token
 */
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({
      required_error: "Refresh token khong duoc de trong",
    })
    .min(1, "Refresh token khong duoc de trong"),
});

/**
 * Schema cho forgot password
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string({
      required_error: "Email khong duoc de trong",
    })
    .min(1, "Email khong duoc de trong")
    .email("Email khong hop le")
    .toLowerCase()
    .trim(),
});

/**
 * Schema cho reset password
 */
export const resetPasswordSchema = z
  .object({
    token: z
      .string({
        required_error: "Token khong duoc de trong",
      })
      .min(1, "Token khong duoc de trong"),

    newPassword: z
      .string({
        required_error: "Mat khau moi khong duoc de trong",
      })
      .min(6, "Mat khau moi phai co it nhat 6 ky tu")
      .max(100, "Mat khau qua dai")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Mat khau phai co it nhat 1 chu hoa, 1 chu thuong va 1 so"
      ),

    confirmPassword: z
      .string({
        required_error: "Xac nhan mat khau khong duoc de trong",
      })
      .min(1, "Xac nhan mat khau khong duoc de trong"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mat khau xac nhan khong khop",
    path: ["confirmPassword"],
  });

/**
 * Schema cho verify email
 */
export const verifyEmailSchema = z.object({
  token: z
    .string({
      required_error: "Token khong duoc de trong",
    })
    .min(1, "Token khong duoc de trong"),
});

/**
 * Schema cho cap nhat profile
 */
export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  address: z.string().max(500).optional(),
  bio: z.string().max(1000).optional(),
});

export default {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  updateProfileSchema,
};
