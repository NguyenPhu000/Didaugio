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
} from "lucide-react";
import { Label, Input, Button } from "@/components/ui";

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
      <div className="bg-white border-2 border-black shadow-sm">
        <div className="bg-black text-white p-4 border-b-2 border-black">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-[#F3E600]" />
            <div>
              <h3 className="tim-meta text-white mb-1">BASIC INFORMATION</h3>
              <p className="text-xs text-gray-400 uppercase font-mono">
                {t("profile.form.basicInfoDesc")}
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Full Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="fullName"
                  className="flex items-center gap-2 tim-meta"
                >
                  <User className="h-4 w-4" />
                  {t("profile.fields.fullName")}
                </Label>
                <Input
                  id="fullName"
                  placeholder={t("profile.placeholders.fullName")}
                  className="rounded-none border-2 border-black h-11 uppercase font-mono text-sm focus-visible:border-[#F3E600] focus-visible:ring-0"
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-600 font-mono uppercase">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email (readonly) */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="flex items-center gap-2 tim-meta"
                >
                  <Mail className="h-4 w-4" />
                  EMAIL
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    value={profile?.email || ""}
                    disabled
                    className="rounded-none border-2 border-gray-300 h-11 font-mono text-sm bg-gray-100 text-gray-600"
                  />
                  <Lock className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 uppercase font-mono">
                  {t("profile.emailCannotChange")}
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="flex items-center gap-2 tim-meta"
                >
                  <Phone className="h-4 w-4" />
                  {t("profile.fields.phone")}
                </Label>
                <Input
                  id="phone"
                  placeholder="0123 456 789"
                  className="rounded-none border-2 border-black h-11 font-mono text-sm focus-visible:border-[#F3E600] focus-visible:ring-0"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-xs text-red-600 font-mono uppercase">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label
                  htmlFor="dateOfBirth"
                  className="flex items-center gap-2 tim-meta"
                >
                  <Calendar className="h-4 w-4" />
                  {t("profile.fields.birthday")}
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  className="rounded-none border-2 border-black h-11 font-mono text-sm focus-visible:border-[#F3E600] focus-visible:ring-0"
                  {...register("dateOfBirth")}
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender" className="tim-meta">
                  {t("profile.fields.gender")}
                </Label>
                <select
                  id="gender"
                  className="flex h-11 w-full rounded-none border-2 border-black bg-white px-3 py-2 font-mono text-sm uppercase focus:outline-none focus:border-[#F3E600] disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("gender")}
                >
                  <option value="">
                    {t("profile.placeholders.selectGender")}
                  </option>
                  <option value="male">{t("profile.gender.male")}</option>
                  <option value="female">{t("profile.gender.female")}</option>
                  <option value="other">{t("profile.gender.other")}</option>
                </select>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label
                  htmlFor="address"
                  className="flex items-center gap-2 tim-meta"
                >
                  <MapPin className="h-4 w-4" />
                  {t("profile.fields.address")}
                </Label>
                <Input
                  id="address"
                  placeholder={t("profile.placeholders.address")}
                  className="rounded-none border-2 border-black h-11 uppercase font-mono text-sm focus-visible:border-[#F3E600] focus-visible:ring-0"
                  {...register("address")}
                />
                {errors.address && (
                  <p className="text-xs text-red-600 font-mono uppercase">
                    {errors.address.message}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio" className="flex items-center gap-2 tim-meta">
                <FileText className="h-4 w-4" />
                {t("profile.fields.bio")}
              </Label>
              <textarea
                id="bio"
                rows={4}
                className="flex w-full rounded-none border-2 border-black bg-white px-4 py-3 text-sm font-mono uppercase placeholder:text-gray-400 focus:outline-none focus:border-[#F3E600] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder={t("profile.placeholders.bio")}
                {...register("bio")}
              />
              {errors.bio && (
                <p className="text-xs text-red-600 font-mono uppercase">
                  {errors.bio.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2 border-t-2 border-black pt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={!isDirty}
                className="rounded-none border-2 border-black h-11 px-6 hover:bg-gray-100 uppercase font-black text-xs cursor-pointer"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                loading={isLoading}
                disabled={!isDirty}
                className="rounded-none border-2 border-black bg-[#F3E600] text-black hover:bg-black hover:text-[#F3E600] h-11 px-8 uppercase font-black text-xs transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none cursor-pointer"
              >
                <Save className="mr-2 h-4 w-4" />
                {t("profile.form.saveChanges")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }
);

ProfileBasicInfoForm.displayName = "ProfileBasicInfoForm";
export default ProfileBasicInfoForm;
