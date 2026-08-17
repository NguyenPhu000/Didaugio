import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FormField = ({ label, required, error, children }) => (
  <div className="space-y-1.5">
    <Label className="flex items-center gap-1">
      {label}
      {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
    {error && <p className="text-[11px] text-destructive">{error}</p>}
  </div>
);

export const BusinessInfoStep = memo(
  ({ register, errors, selectedBusinessType, setValue }) => {
    const { t } = useTranslation();

    const BUSINESS_TYPES = [
      {
        value: "individual",
        label: t("business.register.businessTypeIndividual"),
      },
      {
        value: "household",
        label: t("business.register.businessTypeHousehold"),
      },
      { value: "company", label: t("business.register.businessTypeCompany") },
    ];

    return (
      <div className="space-y-4">
        <FormField
          label={t("business.register.businessName")}
          required
          error={errors.businessName?.message}
        >
          <Input
            {...register("businessName")}
            placeholder={t("business.register.businessNamePlaceholder")}
          />
        </FormField>

        <FormField label={t("business.register.businessType")} required>
          <Select
            value={selectedBusinessType}
            onValueChange={(v) =>
              setValue("businessType", v, { shouldDirty: true })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map((bt) => (
                <SelectItem key={bt.value} value={bt.value}>
                  {bt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={t("business.register.idCard")}
            required
            error={errors.idCardNumber?.message}
          >
            <Input
              {...register("idCardNumber")}
              placeholder={t("business.register.idCardPlaceholder")}
            />
          </FormField>
          <FormField
            label={t("business.register.taxCode")}
            error={errors.taxCode?.message}
          >
            <Input
              {...register("taxCode")}
              placeholder={t("business.register.taxCodePlaceholder")}
            />
          </FormField>
        </div>
      </div>
    );
  }
);

BusinessInfoStep.displayName = "BusinessInfoStep";
export default BusinessInfoStep;
