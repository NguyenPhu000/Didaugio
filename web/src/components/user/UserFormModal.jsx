import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@/components/ui";
import { ROLES } from "@/constants/constants";
import ProvinceDistrictSelect from "@/components/common/ProvinceDistrictSelect";
import { userFormSchema } from "@/schemas/user";
import { formatDateForInput } from "@/utils/dateUtils";
import {
  User,
  Mail,
  Lock,
  Phone,
  ShieldCheck,
  CalendarDays,
  Home,
  Users,
  ChevronDown,
  X,
  Check,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";

// Schema definition removed

const UserFormModal = ({ open, onClose, user, onSuccess }) => {
  const isEdit = !!user;
  const [loading, setLoading] = useState(false);
  let submitActionContent;
  if (loading) {
    submitActionContent = (
      <>
        <Loader2 className="w-4 h-4 animate-spin" />
        Đang xử lý...
      </>
    );
  } else if (isEdit) {
    submitActionContent = (
      <>
        <Check className="w-4 h-4" />
        Cập nhật
      </>
    );
  } else {
    submitActionContent = (
      <>
        <Plus className="w-4 h-4" />
        Thêm người dùng
      </>
    );
  }

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

  // ─── field helpers ─────────────────────────────────────────────────────────

  const Field = ({ label, required, error, icon: Icon, children }) => (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        )}
        {children}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600 font-semibold">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );

  const inputCls = (hasError, hasIcon = true, disabled = false) =>
    [
      "w-full py-2.5 rounded-none border text-sm transition-all outline-none",
      hasIcon ? "pl-9 pr-4" : "px-4",
      "bg-white focus:bg-white",
      hasError
        ? "border-red-500 focus:border-red-600"
        : "border-gray-300 focus:border-black",
      disabled ? "opacity-60 cursor-not-allowed bg-gray-100" : "",
    ]
      .filter(Boolean)
      .join(" ");

  const selectCls =
    "w-full py-2.5 pl-9 pr-8 rounded-none border border-gray-300 bg-white text-sm text-gray-700 focus:border-black outline-none cursor-pointer appearance-none transition-all";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[560px] max-h-[92vh] overflow-hidden p-0 gap-0 rounded-none border border-black bg-white">
        {/* ── Header ── */}
        <DialogHeader className="relative px-6 py-5 border-b border-black bg-white">
          <div className="absolute left-0 top-0 h-full w-1 bg-yellow-400" />
          <div className="flex items-center gap-3 pr-8 pl-2">
            <div className="w-9 h-9 border border-black bg-black flex items-center justify-center shrink-0">
              {isEdit ? (
                <User className="w-4.5 h-4.5 text-white" />
              ) : (
                <Plus className="w-4.5 h-4.5 text-white" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-black leading-tight uppercase tracking-tight">
                {isEdit ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
              </DialogTitle>
              <DialogDescription className="text-[11px] font-semibold text-gray-500 mt-0.5 uppercase tracking-wider">
                {isEdit
                  ? "Cập nhật thông tin tài khoản"
                  : "Điền thông tin để tạo tài khoản mới"}
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 border border-gray-300 hover:border-black hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </DialogHeader>

        {/* ── Scrollable form body ── */}
        <div className="overflow-y-auto max-h-[calc(92vh-190px)] px-6 py-5 bg-white">
          <form id="user-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              {/* Email */}
              <Field
                label="Email"
                required
                error={errors.email?.message}
                icon={Mail}
              >
                <input
                  type="email"
                  {...register("email")}
                  disabled={isEdit}
                  placeholder="example@didaugio.vn"
                  className={inputCls(!!errors.email, true, isEdit)}
                />
              </Field>

              {/* Password — create only */}
              {!isEdit && (
                <Field
                  label="Mật khẩu"
                  required
                  error={errors.password?.message}
                  icon={Lock}
                >
                  <input
                    type="password"
                    {...register("password")}
                    placeholder="Tối thiểu 6 ký tự"
                    className={inputCls(!!errors.password)}
                  />
                </Field>
              )}

              {/* Full Name + Phone — 2 col */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Họ và tên" icon={User}>
                  <input
                    {...register("fullName")}
                    placeholder="Nguyễn Văn A"
                    className={inputCls(false)}
                  />
                </Field>

                <Field
                  label="Số điện thoại"
                  error={errors.phone?.message}
                  icon={Phone}
                >
                  <input
                    {...register("phone")}
                    placeholder="0123456789"
                    className={inputCls(!!errors.phone)}
                  />
                </Field>
              </div>

              {/* Role + Gender — 2 col */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Vai trò" required icon={ShieldCheck}>
                  <select {...register("roleId")} className={selectCls}>
                    <option value={ROLES.STAFF}>Staff</option>
                    <option value={ROLES.BUSINESS}>Business Owner</option>
                    <option value={ROLES.ADMIN}>Admin</option>
                    <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </Field>

                <Field label="Giới tính" icon={Users}>
                  <select {...register("gender")} className={selectCls}>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </Field>
              </div>

              {/* Date of Birth */}
              <Field label="Ngày sinh" icon={CalendarDays}>
                <input
                  type="date"
                  {...register("dateOfBirth")}
                  className={inputCls(false)}
                />
              </Field>

              {/* Province / District */}
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
              <Field label="Địa chỉ chi tiết" icon={Home}>
                <input
                  {...register("address")}
                  placeholder="Số nhà, tên đường..."
                  className={inputCls(false)}
                />
              </Field>
            </div>
          </form>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-black bg-white flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-none border border-black bg-white text-black text-sm font-bold uppercase tracking-wide hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="user-form"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-none border border-black bg-black text-white text-sm font-bold uppercase tracking-wide transition-all hover:bg-gray-800 disabled:opacity-50"
          >
            {submitActionContent}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormModal;
