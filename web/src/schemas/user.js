import { z } from "zod";
import i18n from "@/i18n";

export const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, () => i18n.t("validation.nameMin"))
    .max(100, () => i18n.t("validation.maxLength", { field: "Name", max: 100 }))
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(20, () => i18n.t("validation.phoneMaxLength"))
    .optional()
    .or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  address: z.string().max(500, () => i18n.t("validation.addressMaxLength")).optional().or(z.literal("")),
  bio: z.string().max(1000, () => i18n.t("validation.bioMaxLength")).optional().or(z.literal("")),
});

export const userFormSchema = z.object({
  email: z
    .string()
    .min(1, () => i18n.t("validation.emailRequired"))
    .email(() => i18n.t("validation.email")),
  fullName: z.string().optional(),
  phone: z
    .string()
    .regex(/^[0-9]{10,11}$/, () => i18n.t("validation.phoneFormat"))
    .optional()
    .or(z.literal("")),
  roleId: z.coerce.number().int().positive(() => i18n.t("validation.selectRole")),
  password: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  provinceCode: z.string().optional(),
  districtCode: z.string().optional(),
});
