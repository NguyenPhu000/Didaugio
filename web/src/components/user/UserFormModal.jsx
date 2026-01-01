import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Label,
} from "@/components/ui";
import { ROLES, ROLE_NAMES } from "@/config/constants";
import ProvinceDistrictSelect from "@/components/common/ProvinceDistrictSelect";

const userFormSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự").optional(),
  phone: z
    .string()
    .regex(/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ")
    .optional()
    .or(z.literal("")),
  roleId: z.coerce.number().int().positive("Vui lòng chọn vai trò"),
  password: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .optional()
    .or(z.literal("")),
  gender: z.enum(["male", "female", "other"]).optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  provinceCode: z.string().optional(),
  districtCode: z.string().optional(),
});

const UserFormModal = ({ open, onClose, user, onSuccess }) => {
  const isEdit = !!user;
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: "",
      fullName: "",
      phone: "",
      roleId: ROLES.CUSTOMER,
      password: "",
      gender: "male",
      address: "",
      dateOfBirth: "",
      provinceCode: "",
      districtCode: "",
    },
  });

  const provinceCode = watch("provinceCode");
  const districtCode = watch("districtCode");

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      reset({
        email: user.email || "",
        fullName: user.fullName || "",
        phone: user.phone || "",
        roleId: user.roleId || ROLES.CUSTOMER,
        password: "",
        gender: user.gender || "male",
        address: user.address || "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : "",
        provinceCode: user.provinceCode || "",
        districtCode: user.districtCode || "",
      });
    } else {
      reset({
        email: "",
        fullName: "",
        phone: "",
        roleId: ROLES.CUSTOMER,
        password: "",
        gender: "male",
        address: "",
        dateOfBirth: "",
        provinceCode: "",
        districtCode: "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Clean data - remove empty strings
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== "")
      );

      // For edit, password is optional
      if (isEdit && !cleanData.password) {
        delete cleanData.password;
      }

      await onSuccess(cleanData, isEdit);
      onClose();
      reset();
    } catch (error) {
      console.error("Form submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin người dùng"
              : "Điền thông tin để tạo tài khoản mới"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              disabled={isEdit}
              placeholder="example@didaugio.vn"
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          {!isEdit && (
            <div>
              <Label htmlFor="password">
                Mật khẩu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="Tối thiểu 6 ký tự"
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
          )}

          {/* Full Name */}
          <div>
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input
              id="fullName"
              {...register("fullName")}
              placeholder="Nguyễn Văn A"
            />
            {errors.fullName && (
              <p className="text-sm text-red-500 mt-1">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input id="phone" {...register("phone")} placeholder="0123456789" />
            {errors.phone && (
              <p className="text-sm text-red-500 mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <Label htmlFor="roleId">
              Vai trò <span className="text-red-500">*</span>
            </Label>
            <select
              id="roleId"
              {...register("roleId")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value={ROLES.CUSTOMER}>Khách</option>
              <option value={ROLES.STAFF}>Staff</option>
              <option value={ROLES.BUSINESS}>Business</option>
              <option value={ROLES.ADMIN}>Admin</option>
              <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
            </select>
            {errors.roleId && (
              <p className="text-sm text-red-500 mt-1">
                {errors.roleId.message}
              </p>
            )}
          </div>

          {/* Gender */}
          <div>
            <Label htmlFor="gender">Giới tính</Label>
            <select
              id="gender"
              {...register("gender")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>

          {/* Date of Birth */}
          <div>
            <Label htmlFor="dateOfBirth">Ngày sinh</Label>
            <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
          </div>

          {/* Province and District */}
          <ProvinceDistrictSelect
            provinceCode={provinceCode}
            districtCode={districtCode}
            onProvinceChange={(code) => setValue("provinceCode", code)}
            onDistrictChange={(code) => setValue("districtCode", code)}
            errors={{
              provinceCode: errors.provinceCode?.message,
              districtCode: errors.districtCode?.message,
            }}
          />

          {/* Address */}
          <div>
            <Label htmlFor="address">Địa chỉ chi tiết</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="Số nhà, tên đường..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : isEdit ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormModal;
