import { z } from "zod";

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  userId: z.coerce.number().int().positive().optional(),
  action: z.string().optional(),
  tableName: z.string().optional(),
  recordId: z.coerce.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const createEmailVerificationSchema = z.object({
  userId: z.number().int().positive(),
  email: z.string().email(),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token không được để trống"),
});

export const emailVerificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  userId: z.coerce.number().int().positive().optional(),
  status: z.enum(["pending", "verified", "expired"]).optional(),
});

export const createPasswordResetSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token không được để trống"),
  newPassword: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .max(100, "Mật khẩu quá dài"),
});

export const passwordResetQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  userId: z.coerce.number().int().positive().optional(),
  status: z.enum(["pending", "used", "expired"]).optional(),
});

export const loginHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  userId: z.coerce.number().int().positive().optional(),
  deviceName: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const revokeSessionSchema = z.object({
  sessionId: z.number().int().positive(),
});
