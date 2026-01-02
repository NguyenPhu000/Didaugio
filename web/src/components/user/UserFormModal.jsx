import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { ROLES } from "@/config/constants";
import ProvinceDistrictSelect from "@/components/common/ProvinceDistrictSelect";

// Validation schema
const userFormSchema = z.object({
  email: z
    .string()
    .min(1, "Email không được để trống")
    .email("Email không hợp lệ"),
  fullName: z.string().optional(),
  phone: z
    .string()
    .regex(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số")
    .optional()
    .or(z.literal("")),
  roleId: z.coerce.number().int().positive("Vui lòng chọn vai trò"),
  password: z.string().optional(),
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
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: "",
      fullName: "",
      phone: "",
      roleId: ROLES.GUEST,
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

  // Helper: Format date from ISO to YYYY-MM-DD for input
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return "";
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "";
      // Format as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (open) {
      if (user) {
        // Edit mode - populate form with user data
        // Backend returns flattened profile data at root level
        reset({
          email: user.email || "",
          fullName: user.profile?.fullName || user.fullName || "",
          phone: user.profile?.phone || user.phone || "",
          roleId: user.roleId || ROLES.GUEST,
          password: "",
          gender: user.profile?.gender || user.gender || "male",
          address: user.profile?.address || user.address || "",
          dateOfBirth: formatDateForInput(
            user.profile?.dateOfBirth || user.dateOfBirth
          ),
          provinceCode: user.profile?.provinceCode || user.provinceCode || "",
          districtCode: user.profile?.districtCode || user.districtCode || "",
        });
      } else {
        // Create mode - reset to defaults
        reset({
          email: "",
          fullName: "",
          phone: "",
          roleId: ROLES.GUEST,
          password: "",
          gender: "male",
          address: "",
          dateOfBirth: "",
          provinceCode: "",
          districtCode: "",
        });
      }
    }
  }, [open, user, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Clean data - remove empty strings
      const cleanData = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          cleanData[key] = value;
        }
      });

      // For edit mode, password is optional - remove if empty
      if (isEdit && !cleanData.password) {
        delete cleanData.password;
      }

      // For create mode, password is required
      if (!isEdit && !cleanData.password) {
        throw new Error("Mật khẩu là bắt buộc khi tạo người dùng mới");
      }

      await onSuccess(cleanData, isEdit);
      onClose();
    } catch (error) {
      console.error("Form submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Select className
  const selectClassName =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

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
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password - only for create */}
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
                className={errors.password ? "border-red-500" : ""}
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
            <Input
              id="phone"
              {...register("phone")}
              placeholder="0123456789"
              className={errors.phone ? "border-red-500" : ""}
            />
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
              className={selectClassName}
            >
              <option value={ROLES.GUEST}>Guest</option>
              <option value={ROLES.STAFF}>Staff</option>
              <option value={ROLES.BUSINESS}>Business Owner</option>
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
              className={selectClassName}
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
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
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
