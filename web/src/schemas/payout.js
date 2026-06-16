import { z } from "zod";
import i18n from "@/i18n";

export const payoutRequestSchema = z.object({
  amount: z.coerce
    .number()
    .min(50000, () => "Số tiền rút tối thiểu là 50,000 VNĐ")
    .positive(() => "Số tiền phải lớn hơn 0"),
  bankName: z
    .string()
    .min(1, () => i18n.t("validation.required", { field: "Tên ngân hàng" }))
    .max(200, () => i18n.t("validation.maxLength", { field: "Tên ngân hàng", max: 200 })),
  bankAccountNumber: z
    .string()
    .min(1, () => i18n.t("validation.required", { field: "Số tài khoản" }))
    .regex(/^[0-9]+$/, () => "Số tài khoản chỉ chứa chữ số")
    .max(30, () => i18n.t("validation.maxLength", { field: "Số tài khoản", max: 30 })),
  bankAccountName: z
    .string()
    .min(1, () => i18n.t("validation.required", { field: "Tên chủ tài khoản" }))
    .max(200, () => i18n.t("validation.maxLength", { field: "Tên chủ tài khoản", max: 200 })),
  note: z
    .string()
    .max(500, () => i18n.t("validation.maxLength", { field: "Ghi chú", max: 500 }))
    .optional()
    .or(z.literal("")),
});

export const payoutReviewSchema = z
  .object({
    action: z.enum(["approve", "reject"], {
      errorMap: () => ({ message: "Hành động không hợp lệ" }),
    }),
    rejectionReason: z
      .string()
      .max(1000, () => i18n.t("validation.maxLength", { field: "Lý do từ chối", max: 1000 }))
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => data.action !== "reject" || (data.rejectionReason && data.rejectionReason.trim().length > 0),
    {
      message: "Vui lòng nhập lý do từ chối",
      path: ["rejectionReason"],
    },
  );

export const payoutFilterSchema = z.object({
  status: z.string().optional(),
  dateRange: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
    .optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
});
