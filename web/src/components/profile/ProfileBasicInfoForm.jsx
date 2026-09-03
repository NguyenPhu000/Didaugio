import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  Save,
  Lock,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Label, Input } from "@/components/ui";

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
      <div className="rounded-[28px] border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Header Section */}
        <div className="border-b border-black/[0.05] bg-[#FAF9F5] px-6 py-5 sm:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                <User className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-950">
                  {t("profile.tabs.info", "Thông tin cá nhân & Liên hệ")}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {t("profile.form.basicInfoDesc")}
                </p>
              </div>
            </div>
            {isDirty && (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-900 border border-amber-300 shadow-2xs animate-pulse">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                Thay đổi chưa lưu
              </span>
            )}
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Full Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="fullName"
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  {t("profile.fields.fullName")}
                </Label>
                <input
                  id="fullName"
                  placeholder={t("profile.placeholders.fullName")}
                  className="w-full h-11 px-4 text-xs font-medium rounded-xl bg-[#F8F7F3] border border-black/[0.06] focus:bg-white focus:border-slate-950 focus:ring-1 focus:ring-slate-950 outline-none transition-all text-slate-950 placeholder:text-slate-400"
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-[11px] font-semibold text-rose-600">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  Địa chỉ Email (Định danh)
                </Label>
                <div className="relative">
                  <input
                    id="email"
                    value={profile?.email || ""}
                    disabled
                    className="w-full h-11 px-4 text-xs font-mono font-medium rounded-xl bg-slate-100/90 border border-black/[0.05] text-slate-500 cursor-not-allowed pr-10"
                  />
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                <p className="text-[11px] font-medium text-slate-400">
                  {t("profile.emailCannotChange")}
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {t("profile.fields.phone")}
                </Label>
                <input
                  id="phone"
                  placeholder="0912 345 678"
                  className="w-full h-11 px-4 text-xs font-mono font-medium rounded-xl bg-[#F8F7F3] border border-black/[0.06] focus:bg-white focus:border-slate-950 focus:ring-1 focus:ring-slate-950 outline-none transition-all text-slate-950 placeholder:text-slate-400"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-[11px] font-semibold text-rose-600">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label
                  htmlFor="dateOfBirth"
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {t("profile.fields.birthday")}
                </Label>
                <input
                  id="dateOfBirth"
                  type="date"
                  className="w-full h-11 px-4 text-xs font-medium rounded-xl bg-[#F8F7F3] border border-black/[0.06] focus:bg-white focus:border-slate-950 focus:ring-1 focus:ring-slate-950 outline-none transition-all text-slate-950"
                  {...register("dateOfBirth")}
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label
                  htmlFor="gender"
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  {t("profile.fields.gender")}
                </Label>
                <select
                  id="gender"
                  className="flex h-11 w-full rounded-xl border border-black/[0.06] bg-[#F8F7F3] px-3.5 text-xs font-semibold text-slate-950 transition focus:outline-none focus:bg-white focus:border-slate-950 focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("gender")}
                >
                  <option value="">{t("profile.placeholders.selectGender")}</option>
                  <option value="male">{t("profile.gender.male")}</option>
                  <option value="female">{t("profile.gender.female")}</option>
                  <option value="other">{t("profile.gender.other")}</option>
                </select>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label
                  htmlFor="address"
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {t("profile.fields.address")}
                </Label>
                <input
                  id="address"
                  placeholder={t("profile.placeholders.address")}
                  className="w-full h-11 px-4 text-xs font-medium rounded-xl bg-[#F8F7F3] border border-black/[0.06] focus:bg-white focus:border-slate-950 focus:ring-1 focus:ring-slate-950 outline-none transition-all text-slate-950 placeholder:text-slate-400"
                  {...register("address")}
                />
                {errors.address && (
                  <p className="text-[11px] font-semibold text-rose-600">
                    {errors.address.message}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label
                htmlFor="bio"
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                {t("profile.fields.bio")}
              </Label>
              <textarea
                id="bio"
                rows={3}
                className="flex w-full rounded-2xl border border-black/[0.06] bg-[#F8F7F3] px-4 py-3 text-xs font-medium text-slate-950 placeholder:text-slate-400 transition focus:outline-none focus:bg-white focus:border-slate-950 focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder={t("profile.placeholders.bio")}
                {...register("bio")}
              />
              {errors.bio && (
                <p className="text-[11px] font-semibold text-rose-600">
                  {errors.bio.message}
                </p>
              )}
            </div>

            {/* Actions Footer */}
            <div className="border-t border-black/[0.05] pt-5 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => reset()}
                disabled={!isDirty || isLoading}
                className="h-11 px-5 rounded-full border border-black/[0.08] font-bold text-xs text-slate-700 hover:bg-slate-100 transition cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={!isDirty || isLoading}
                className="h-11 px-7 rounded-full bg-slate-950 hover:bg-black text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 text-amber-300" />
                    <span>{t("profile.form.saveChanges")}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
);

ProfileBasicInfoForm.displayName = "ProfileBasicInfoForm";
export default ProfileBasicInfoForm;
