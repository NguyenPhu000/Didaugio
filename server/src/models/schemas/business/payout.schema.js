import { z } from "zod";

export const createPayoutSchema = z.object({
  amount: z.coerce.number().int().positive("Số tiền rút phải lớn hơn 0"),
  bankName: z.string().trim().min(1, "Tên ngân hàng không được để trống"),
  bankAccount: z.string().trim().min(1, "Số tài khoản không được để trống"),
  bankOwner: z.string().trim().min(1, "Tên chủ tài khoản không được để trống"),
  note: z.string().trim().max(500).optional().nullable(),
});

export const payoutIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID payout không hợp lệ"),
});
