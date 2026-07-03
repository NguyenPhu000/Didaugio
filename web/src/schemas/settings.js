import { z } from "zod";
import i18n from "@/i18n";

export const generalSettingsSchema = z.object({
  siteName: z
    .string()
    .min(1, () => i18n.t("validation.required", { field: "Tên trang" }))
    .max(200, () => i18n.t("validation.maxLength", { field: "Tên trang", max: 200 })),
  siteDescription: z
    .string()
    .max(1000, () => i18n.t("validation.maxLength", { field: "Mô tả", max: 1000 }))
    .optional()
    .or(z.literal("")),
  contactEmail: z
    .string()
    .email(() => i18n.t("validation.emailInvalid"))
    .optional()
    .or(z.literal("")),
  contactPhone: z
    .string()
    .regex(/^(0[0-9]{9,10})?$/, () => i18n.t("validation.phoneFormat"))
    .optional()
    .or(z.literal("")),
  timezone: z
    .string()
    .min(1, () => i18n.t("validation.required", { field: "Múi giờ" })),
  currency: z
    .string()
    .min(1, () => i18n.t("validation.required", { field: "Đơn vị tiền tệ" })),
});

export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  bookingAlerts: z.boolean().default(true),
  payoutAlerts: z.boolean().default(true),
});

export const securitySettingsSchema = z.object({
  twoFactorEnabled: z.boolean().default(false),
  sessionTimeout: z.coerce
    .number()
    .int()
    .min(5, () => "Thời gian phiên tối thiểu 5 phút")
    .max(1440, () => "Thời gian phiên tối đa 1440 phút"),
  maxLoginAttempts: z.coerce
    .number()
    .int()
    .min(1, () => "Số lần đăng nhập tối thiểu là 1")
    .max(20, () => "Số lần đăng nhập tối đa là 20"),
  passwordMinLength: z.coerce
    .number()
    .int()
    .min(6, () => "Độ dài mật khẩu tối thiểu là 6")
    .max(128, () => "Độ dài mật khẩu tối đa là 128"),
});

export const bookingRulesSchema = z.object({
  autoApprove: z.boolean().default(false),
  cancellationWindowHours: z.coerce
    .number()
    .int()
    .min(0, () => "Thời gian hủy không được âm")
    .max(720, () => "Thời gian hủy tối đa 720 giờ"),
  maxAdvanceBookingDays: z.coerce
    .number()
    .int()
    .min(1, () => "Đặt trước tối thiểu 1 ngày")
    .max(365, () => "Đặt trước tối đa 365 ngày"),
  minAdvanceBookingHours: z.coerce
    .number()
    .int()
    .min(0, () => "Thời gian đặt trước tối thiểu không được âm")
    .max(720, () => "Thời gian đặt trước tối đa 720 giờ"),
});
