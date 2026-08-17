import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Building2, CreditCard, AlertCircle, CheckCircle2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BusinessSectionCard } from "@/components/business/ui";
import { BUSINESS_TOKENS } from "@/components/business/tokens";
import { cn } from "@/lib/utils";
import ProfileEditDocumentsSection from "./ProfileEditDocumentsSection";

const FormField = ({ label, error, required, children }) => (
  <div className="space-y-1.5">
    <Label className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
      {label}
      {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
    {error && <p className="text-[11px] text-destructive">{error}</p>}
  </div>
);

export const ProfileEditForm = memo(
  ({
    register,
    handleSubmit,
    onSubmit,
    errors,
    watch,
    setValue,
    businessTypes,
    documentFiles,
    setDocumentFiles,
    existingDocumentPreviews,
    saving,
    isDirty,
    hasDocumentChanges,
    onCancel,
  }) => {
    const { t } = useTranslation();

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Basic Info */}
          <BusinessSectionCard title={t("business.profile.basicInfo")} titleIcon={Building2}>
            <div className="space-y-4">
              <FormField
                label={t("business.profile.businessName")}
                required
                error={errors.businessName?.message}
              >
                <Input
                  {...register("businessName")}
                  placeholder={t("business.profile.businessNameExample")}
                />
              </FormField>

              <FormField label={t("business.profile.businessType")}>
                <Select
                  value={watch("businessType") || ""}
                  onValueChange={(v) =>
                    setValue("businessType", v, { shouldDirty: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((bt) => (
                      <SelectItem key={bt.value} value={bt.value}>
                        {bt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  label={t("business.profile.idNumber")}
                  required
                  error={errors.idCardNumber?.message}
                >
                  <Input
                    {...register("idCardNumber")}
                    placeholder={t("business.profile.idCardPlaceholder")}
                  />
                </FormField>
                <FormField label={t("business.profile.taxCode")} error={errors.taxCode?.message}>
                  <Input {...register("taxCode")} placeholder={t("business.profile.taxCodePlaceholder")} />
                </FormField>
              </div>
            </div>
          </BusinessSectionCard>

          {/* Bank Info */}
          <BusinessSectionCard title={t("business.profile.bankInfo")} titleIcon={CreditCard}>
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>{t("business.profile.bankInfoDesc")}</p>
              </div>

              <FormField label={t("business.profile.bankName")}>
                <Input
                  {...register("bankName")}
                  placeholder={t("business.profile.bankNamePlaceholder")}
                />
              </FormField>

              <FormField label={t("business.profile.bankAccount")}>
                <Input
                  {...register("bankAccountNumber")}
                  placeholder={t("business.profile.bankAccountPlaceholder")}
                />
              </FormField>

              <FormField label={t("business.profile.accountHolder")}>
                <Input
                  {...register("bankAccountOwner")}
                  placeholder={t("business.profile.accountHolderPlaceholder")}
                />
              </FormField>
            </div>
          </BusinessSectionCard>

          {/* Edit Documents */}
          <ProfileEditDocumentsSection
            documentFiles={documentFiles}
            setDocumentFiles={setDocumentFiles}
            existingDocumentPreviews={existingDocumentPreviews}
            saving={saving}
          />
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-6 z-50">
          <div
            className={cn(
              BUSINESS_TOKENS.card,
              "p-3 flex items-center justify-between gap-3"
            )}
          >
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              {isDirty ? (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-amber-600 font-bold">
                    {t("business.profile.unsavedChanges")}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-600 font-bold">
                    {t("business.profile.allSaved")}
                  </span>
                </>
              )}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
              >
                {t("business.profile.discard")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving || (!isDirty && !hasDocumentChanges)}
                className="gap-2 bg-slate-950 text-white"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? t("business.profile.saving") : t("business.profile.saveChanges")}
              </Button>
            </div>
          </div>
        </div>
      </form>
    );
  }
);

ProfileEditForm.displayName = "ProfileEditForm";
export default ProfileEditForm;
