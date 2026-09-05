import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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

export const BankInfoStep = memo(({ register }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("business.register.bankInfoDesc")}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label={t("business.register.bankName")}>
          <Input
            {...register("bankName")}
            placeholder={t("business.register.bankNamePlaceholder")}
          />
        </FormField>
        <FormField label={t("business.register.bankAccount")}>
          <Input {...register("bankAccountNumber")} />
        </FormField>
        <FormField label={t("business.register.accountHolder")}>
          <Input {...register("bankAccountOwner")} />
        </FormField>
      </div>
    </div>
  );
});

BankInfoStep.displayName = "BankInfoStep";
export default BankInfoStep;
