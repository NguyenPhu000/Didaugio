import { z } from "zod";
import i18n from "@/i18n";

const GROUP_BY_OPTIONS = ["day", "week", "month"];
const EXPORT_FORMATS = ["csv", "xlsx"];

export const revenueFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  placeId: z.coerce.number().int().positive().optional(),
  groupBy: z.enum(GROUP_BY_OPTIONS).default("day"),
});

export const exportSchema = z.object({
  format: z.enum(EXPORT_FORMATS, {
    errorMap: () => ({ message: "Định dạng xuất không hợp lệ" }),
  }),
  dateRange: z
    .object({
      from: z.string().min(1, () => i18n.t("validation.required", { field: "Ngày bắt đầu" })),
      to: z.string().min(1, () => i18n.t("validation.required", { field: "Ngày kết thúc" })),
    })
    .refine((data) => new Date(data.to) >= new Date(data.from), {
      message: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu",
      path: ["to"],
    }),
  includeFields: z
    .array(z.string().min(1))
    .min(1, () => "Vui lòng chọn ít nhất một trường dữ liệu"),
});
