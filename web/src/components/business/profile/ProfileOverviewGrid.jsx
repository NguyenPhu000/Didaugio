import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Building2, CreditCard, Lock, Eye, EyeOff } from "lucide-react";
import { BusinessSectionCard } from "@/components/business/ui";
import DocumentUploadCard from "@/components/business/DocumentUploadCard";
import ProfileContractSection from "./ProfileContractSection";

export const ProfileOverviewGrid = memo(
  ({
    basicInfoRows,
    bankInfoRows,
    showDecrypted,
    onToggleShowDecrypted,
    business,
    contractSectionRef,
    canSignContract,
    onInitiateSignContract,
  }) => {
    const { t } = useTranslation();

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Basic Info */}
        <BusinessSectionCard title={t("business.profile.basicInfo")} titleIcon={Building2}>
          <div className="space-y-0">
            {basicInfoRows.map(({ label, value, isSensitive }) => (
              <div
                key={label}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 border-b border-border/50 last:border-0 gap-1"
              >
                <span className="text-xs text-muted-foreground sm:w-36 shrink-0">
                  {label}
                </span>
                <div className="flex items-center gap-1.5 sm:text-right">
                  <span className="text-sm font-medium text-foreground">
                    {value || (
                      <span className="text-muted-foreground/50 italic text-xs">
                        {t("business.profile.notUpdated")}
                      </span>
                    )}
                  </span>
                  {isSensitive && value && (
                    <button
                      type="button"
                      onClick={onToggleShowDecrypted}
                      className="text-slate-400 hover:text-slate-600 transition focus:outline-hidden"
                      title={showDecrypted ? "Ẩn" : "Xem"}
                    >
                      {showDecrypted ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </BusinessSectionCard>

        {/* Bank Info */}
        <BusinessSectionCard title={t("business.profile.bankInfo")} titleIcon={CreditCard}>
          <div className="space-y-0">
            {bankInfoRows.map(({ label, value, isSensitive }) => (
              <div
                key={label}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 border-b border-border/50 last:border-0 gap-1"
              >
                <span className="text-xs text-muted-foreground sm:w-36 shrink-0">
                  {label}
                </span>
                <div className="flex items-center gap-1.5 sm:text-right">
                  <span className="text-sm font-medium text-foreground">
                    {value || (
                      <span className="text-muted-foreground/50 italic text-xs">
                        {t("business.profile.notUpdated")}
                      </span>
                    )}
                  </span>
                  {isSensitive && value && (
                    <button
                      type="button"
                      onClick={onToggleShowDecrypted}
                      className="text-slate-400 hover:text-slate-600 transition focus:outline-hidden"
                      title={showDecrypted ? "Ẩn" : "Xem"}
                    >
                      {showDecrypted ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </BusinessSectionCard>

        {/* Secure Documents */}
        <BusinessSectionCard
          title={t("business.profile.secureDocuments")}
          titleIcon={Lock}
          description={t("business.profile.secureDocumentsDesc")}
          className="lg:col-span-2"
        >
          <DocumentUploadCard businessId={business?.id} business={business} />
        </BusinessSectionCard>

        {/* E-Contract */}
        <ProfileContractSection
          contractSectionRef={contractSectionRef}
          business={business}
          canSignContract={canSignContract}
          onInitiateSignContract={onInitiateSignContract}
        />
      </div>
    );
  }
);

ProfileOverviewGrid.displayName = "ProfileOverviewGrid";
export default ProfileOverviewGrid;
