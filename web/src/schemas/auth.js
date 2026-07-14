import { z } from "zod";
import i18n from "@/i18n";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const loginSchema = z.object({
  identifier: z.string().min(1, () => i18n.t("validation.emailRequired")),
  password: z
    .string()
    .min(1, () => i18n.t("validation.passwordRequired")),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(() => i18n.t("validation.emailInvalid")).toLowerCase(),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2, () => i18n.t("validation.fullNameMin", { min: 2 })),
    username: z
      .string()
      .min(3, () => i18n.t("validation.usernameMin", { min: 3 }))
      .max(30, () => i18n.t("validation.usernameMax", { max: 30 }))
      .regex(USERNAME_REGEX, () => i18n.t("validation.usernamePattern")),
    email: z.string().email(() => i18n.t("validation.emailInvalid")),
    password: z
      .string()
      .min(8, () => i18n.t("validation.passwordMin", { min: 8 }))
      .regex(PASSWORD_REGEX, () => i18n.t("validation.passwordComplexity")),
    confirmPassword: z.string().min(8, () => i18n.t("validation.passwordMin", { min: 8 })),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: () => i18n.t("validation.passwordMismatch"),
    path: ["confirmPassword"],
  });
