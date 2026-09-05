import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

export const ProfileBasicInfoForm = memo(
  ({
    profile,
    register,
    handleSubmit,
    onSubmit,
    errors,
    reset,
    isDirty,
    isLoading,
  }) => {
    const { t } = useTranslation();

    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[540px] flex flex-col justify-between space-y-7">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-[#1D1D1F]">
              Thông tin cá nhân
            </h3>
            <p className="text-xs text-[#86868B] mt-0.5">
              Cập nhật tên hiển thị, thông tin liên lạc và hồ sơ của bạn
            </p>
          </div>

          {isDirty && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#FFF2E5] text-[#FF9500] self-start sm:self-auto">
              Chưa lưu thay đổi
            </span>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-xs font-medium text-[#1D1D1F]">
                Họ và tên
              </label>
              <input
                id="fullName"
                placeholder="Nhập họ và tên đầy đủ"
                className="w-full h-10 px-3.5 text-xs text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#EBEBF0] focus:bg-white border border-transparent focus:border-[#0071E3] rounded-xl outline-none transition-all placeholder:text-[#86868B]"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-[11px] font-medium text-[#FF3B30]">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email (Readonly) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="email" className="block text-xs font-medium text-[#1D1D1F]">
                  Địa chỉ email
                </label>
                <span className="text-[11px] text-[#86868B]">Chỉ đọc</span>
              </div>
              <input
                id="email"
                value={profile?.email || ""}
                disabled
                className="w-full h-10 px-3.5 text-xs text-[#86868B] bg-[#F5F5F7]/60 border border-transparent rounded-xl cursor-not-allowed"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-xs font-medium text-[#1D1D1F]">
                Số điện thoại
              </label>
              <input
                id="phone"
                placeholder="0912 345 678"
                className="w-full h-10 px-3.5 text-xs text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#EBEBF0] focus:bg-white border border-transparent focus:border-[#0071E3] rounded-xl outline-none transition-all placeholder:text-[#86868B]"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-[11px] font-medium text-[#FF3B30]">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <label htmlFor="dateOfBirth" className="block text-xs font-medium text-[#1D1D1F]">
                Ngày sinh
              </label>
              <input
                id="dateOfBirth"
                type="date"
                className="w-full h-10 px-3.5 text-xs text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#EBEBF0] focus:bg-white border border-transparent focus:border-[#0071E3] rounded-xl outline-none transition-all"
                {...register("dateOfBirth")}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label htmlFor="gender" className="block text-xs font-medium text-[#1D1D1F]">
                Giới tính
              </label>
              <select
                id="gender"
                className="w-full h-10 px-3.5 text-xs text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#EBEBF0] focus:bg-white border border-transparent focus:border-[#0071E3] rounded-xl outline-none transition-all cursor-pointer"
                {...register("gender")}
              >
                <option value="">Chọn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label htmlFor="address" className="block text-xs font-medium text-[#1D1D1F]">
                Địa chỉ
              </label>
              <input
                id="address"
                placeholder="Ninh Kiều, Cần Thơ..."
                className="w-full h-10 px-3.5 text-xs text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#EBEBF0] focus:bg-white border border-transparent focus:border-[#0071E3] rounded-xl outline-none transition-all placeholder:text-[#86868B]"
                {...register("address")}
              />
              {errors.address && (
                <p className="text-[11px] font-medium text-[#FF3B30]">
                  {errors.address.message}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label htmlFor="bio" className="block text-xs font-medium text-[#1D1D1F]">
              Tiểu sử
            </label>
            <textarea
              id="bio"
              rows={3}
              className="w-full p-3.5 text-xs text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#EBEBF0] focus:bg-white border border-transparent focus:border-[#0071E3] rounded-xl outline-none transition-all resize-none placeholder:text-[#86868B]"
              placeholder="Thêm một vài thông tin giới thiệu về bạn..."
              {...register("bio")}
            />
            {errors.bio && (
              <p className="text-[11px] font-medium text-[#FF3B30]">
                {errors.bio.message}
              </p>
            )}
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              disabled={!isDirty || isLoading}
              className="px-4 py-2 text-xs font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-xl transition-colors cursor-pointer disabled:opacity-40"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={!isDirty || isLoading}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#0071E3] hover:bg-[#0077ED] active:scale-[0.98] rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-40 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </div>
    );
  }
);

ProfileBasicInfoForm.displayName = "ProfileBasicInfoForm";
export default ProfileBasicInfoForm;
