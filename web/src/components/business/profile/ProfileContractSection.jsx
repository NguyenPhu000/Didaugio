import React from "react";
import { useTranslation } from "react-i18next";
import { FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusinessSectionCard } from "@/components/business/ui";
import ContractPdfViewer from "@/components/business/ContractPdfViewer";

export const ProfileContractSection = ({
  contractSectionRef,
  business,
  canSignContract,
  onInitiateSignContract,
}) => {
  const { t } = useTranslation();

  return (
    <div
      ref={contractSectionRef}
      id="business-contract-section"
      className="scroll-mt-24 lg:col-span-2"
    >
      <BusinessSectionCard title={t("business.profile.contract")} titleIcon={FileSignature}>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 dark:border-border/60 p-4 bg-slate-50/50 dark:bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {t("business.profile.contractStatus")}
            </p>
            <p className="mt-1 text-sm font-extrabold text-foreground">
              {business?.contractSigned ? t("business.profile.signed") : t("business.profile.unsigned")}
            </p>
            {business?.contractVersion && (
              <p className="text-xs text-muted-foreground mt-1">
                {t("business.profile.contractVersion")} {business.contractVersion}
              </p>
            )}
            {business?.contractSignedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                {t("business.profile.signedAt")}{" "}
                {new Date(business.contractSignedAt).toLocaleString("vi-VN")}
              </p>
            )}
          </div>

          {business?.id && (
            <ContractPdfViewer businessId={business.id} />
          )}

          <Button
            type="button"
            className="w-full rounded-2xl h-10 font-bold bg-slate-950 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground shadow-xs"
            onClick={onInitiateSignContract}
            disabled={!canSignContract}
          >
            {business?.contractSigned
              ? t("business.profile.contractCompleted")
              : t("business.profile.signContract")}
          </Button>
        </div>
      </BusinessSectionCard>
    </div>
  );
};

export default ProfileContractSection;
