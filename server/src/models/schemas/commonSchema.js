import { z } from "zod";

export const idSchema = z.coerce
  .number({
    required_error: "ID không được để trống",
    invalid_type_error: "ID phải là số",
  })
  .int("ID phải là số nguyên")
  .positive("ID phải lớn hơn 0");

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
