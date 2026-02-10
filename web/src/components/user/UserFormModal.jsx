import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent } from "@/components/ui";
import { ROLES } from "@/constants/constants";
import ProvinceDistrictSelect from "@/components/common/ProvinceDistrictSelect";
import { userFormSchema } from "@/schemas/user";
import { formatDateForInput } from "@/utils/dateUtils";

// Schema definition removed

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
      roleId: ROLES.BUSINESS, // Default to BUSINESS (GUEST is mobile-only)
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
          roleId: user.roleId || ROLES.BUSINESS, // Fallback to BUSINESS (GUEST is mobile-only)
          password: "",
          gender: user.profile?.gender || user.gender || "male",
          address: user.profile?.address || user.address || "",
          dateOfBirth: formatDateForInput(
            user.profile?.dateOfBirth || user.dateOfBirth,
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
          roleId: ROLES.BUSINESS, // Default to BUSINESS (GUEST is mobile-only)
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
  const inputClassName =
    "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-700 dark:text-slate-300 placeholder:text-slate-400";

  const selectClassName =
    "w-full py-2.5 pl-10 pr-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:ring-blue-600 focus:border-blue-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors appearance-none";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[500px] max-h-[90vh] overflow-hidden p-0 gap-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {isEdit ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <span className="material-icons-round text-slate-400">close</span>
            </button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEdit
              ? "Điền thông tin để tạo tài khoản mới"
              : "Điền thông tin để tạo tài khoản mới"}
          </p>
        </div>

        {/* Form Content - Scrollable */}
        <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <span className="material-icons-round text-lg">email</span>
                </span>
                <input
                  type="email"
                  {...register("email")}
                  disabled={isEdit}
                  placeholder="example@didaugio.vn"
                  className={`${inputClassName} ${
                    errors.email ? "border-red-500 focus:border-red-500" : ""
                  } ${isEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <span className="material-icons-round text-sm">error</span>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password - only for create */}
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <span className="material-icons-round text-lg">lock</span>
                  </span>
                  <input
                    type="password"
                    {...register("password")}
                    placeholder="Tối thiểu 6 ký tự"
                    className={`${inputClassName} ${
                      errors.password
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }`}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <span className="material-icons-round text-sm">error</span>
                    {errors.password.message}
                  </p>
                )}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Họ và tên
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <span className="material-icons-round text-lg">person</span>
                </span>
                <input
                  {...register("fullName")}
                  placeholder="Nguyễn Văn A"
                  className={inputClassName}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Số điện thoại
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <span className="material-icons-round text-lg">phone</span>
                </span>
                <input
                  {...register("phone")}
                  placeholder="0123456789"
                  className={`${inputClassName} ${
                    errors.phone ? "border-red-500 focus:border-red-500" : ""
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <span className="material-icons-round text-sm">error</span>
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Role and Gender - 2 columns */}
            <div className="grid grid-cols-2 gap-3">
              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Vai trò <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                    <span className="material-icons-round text-lg">
                      admin_panel_settings
                    </span>
                  </span>
                  <select {...register("roleId")} className={selectClassName}>
                    {/* GUEST role removed - mobile app only */}
                    <option value={ROLES.STAFF}>Staff</option>
                    <option value={ROLES.BUSINESS}>Business Owner</option>
                    <option value={ROLES.ADMIN}>Admin</option>
                    <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <span className="material-icons-round text-lg">
                      expand_more
                    </span>
                  </span>
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Giới tính
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                    <span className="material-icons-round text-lg">wc</span>
                  </span>
                  <select {...register("gender")} className={selectClassName}>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <span className="material-icons-round text-lg">
                      expand_more
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Ngày sinh
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <span className="material-icons-round text-lg">cake</span>
                </span>
                <input
                  type="date"
                  {...register("dateOfBirth")}
                  className={inputClassName}
                />
              </div>
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Địa chỉ chi tiết
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <span className="material-icons-round text-lg">home</span>
                </span>
                <input
                  {...register("address")}
                  placeholder="Số nhà, tên đường..."
                  className={inputClassName}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm text-sm font-medium disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 text-sm font-medium disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="material-icons-round text-lg animate-spin">
                  refresh
                </span>
                Đang xử lý...
              </>
            ) : (
              <>
                <span className="material-icons-round text-lg">
                  {isEdit ? "check" : "add"}
                </span>
                {isEdit ? "Cập nhật" : "Thêm người dùng"}
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormModal;
