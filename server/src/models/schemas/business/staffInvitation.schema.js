import { z } from "zod";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export const acceptInvitationSchema = z.object({
  fullName: z
    .string({ required_error: "Họ tên không được để trống" })
    .min(1, "Họ tên không được để trống")
    .max(100, "Họ tên quá dài")
    .trim(),

  phone: z
    .string()
    .max(20, "Số điện thoại quá dài")
    .optional(),

  password: z
    .string({ required_error: "Mật khẩu không được để trống" })
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .max(100, "Mật khẩu quá dài")
    .regex(
      PASSWORD_REGEX,
      "Mật khẩu phải có ít nhất: 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt",
    ),
});
