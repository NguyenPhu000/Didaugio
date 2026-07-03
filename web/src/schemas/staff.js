import { z } from "zod";
import i18n from "@/i18n";

export const createStaffSchema = z.object({
  fullName: z
    .string()
    .min(2, () => i18n.t("validation.fullNameMin", { min: 2 }))
    .max(100, () => i18n.t("validation.maxLength", { field: "Họ tên", max: 100 })),
  email: z
    .string()
    .min(1, () => i18n.t("validation.emailRequired"))
    .email(() => i18n.t("validation.emailInvalid")),
  username: z
    .string()
    .min(3, () => i18n.t("validation.usernameMin", { min: 3 }))
    .max(30, () => i18n.t("validation.usernameMax", { max: 30 }))
    .regex(/^[a-zA-Z0-9_]+$/, () => i18n.t("validation.usernamePattern")),
  phone: z
    .string()
    .regex(/^(0[0-9]{9,10})?$/, () => i18n.t("validation.phoneFormat"))
    .optional()
    .or(z.literal("")),
  roleIds: z
    .array(z.number().int().positive())
    .min(1, () => "Vui lòng chọn ít nhất một vai trò"),
});

export const updateStaffSchema = z.object({
  fullName: z
    .string()
    .min(2, () => i18n.t("validation.fullNameMin", { min: 2 }))
    .max(100, () => i18n.t("validation.maxLength", { field: "Họ tên", max: 100 }))
    .optional(),
  email: z
    .string()
    .email(() => i18n.t("validation.emailInvalid"))
    .optional(),
  phone: z
    .string()
    .regex(/^(0[0-9]{9,10})?$/, () => i18n.t("validation.phoneFormat"))
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().optional(),
});

export const staffInviteSchema = z.object({
  email: z
    .string()
    .min(1, () => i18n.t("validation.emailRequired"))
    .email(() => i18n.t("validation.emailInvalid")),
  roleIds: z
    .array(z.number().int().positive())
    .min(1, () => "Vui lòng chọn ít nhất một vai trò"),
});

export const permissionMatrixSchema = z.object({
  roleId: z.coerce
    .number()
    .int()
    .positive(() => i18n.t("validation.selectRole")),
  permissions: z
    .array(z.string().min(1))
    .default([]),
});
