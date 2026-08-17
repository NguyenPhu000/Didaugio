import React from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import { BusinessSectionCard } from "@/components/business/ui";
import DocumentImageUploadField from "@/components/business/DocumentImageUploadField";
import { DOCUMENT_SAMPLE_IMAGES } from "@/components/business/documentImageConstants";

export const ProfileEditDocumentsSection = ({
  documentFiles,
  setDocumentFiles,
  existingDocumentPreviews,
  saving,
}) => {
  const { t } = useTranslation();

  return (
    <BusinessSectionCard
      title={t("business.profile.updateDocuments")}
      titleIcon={CheckCircle2}
      className="lg:col-span-2"
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-border/70 bg-slate-50/50 dark:bg-muted/20 p-4 sm:p-5">
          <h4 className="text-sm font-extrabold text-foreground">
            {t("business.profile.uploadTitle")}
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("business.profile.uploadDesc")}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <DocumentImageUploadField
              label={t("business.profile.businessLicense")}
              required
              value={documentFiles.businessLicense}
              onChange={(files) =>
                setDocumentFiles((prev) => ({
                  ...prev,
                  businessLicense: files,
                }))
              }
              hint={t("business.profile.licenseHint")}
              fallbackPreview={
                existingDocumentPreviews.businessLicense ||
                DOCUMENT_SAMPLE_IMAGES.portrait
              }
              previewAlt={t("business.profile.altBusinessLicense")}
              previewClassName="h-[300px] sm:h-[360px]"
              disabled={saving}
              acceptPdf
            />

            <DocumentImageUploadField
              label={t("business.profile.idFront")}
              required
              value={documentFiles.idCardFront}
              onChange={(files) =>
                setDocumentFiles((prev) => ({
                  ...prev,
                  idCardFront: files,
                }))
              }
              hint={t("business.profile.idFrontHint")}
              fallbackPreview={
                existingDocumentPreviews.idCardFront ||
                DOCUMENT_SAMPLE_IMAGES.idCardFront
              }
              previewAlt={t("business.profile.altIdFront")}
              previewClassName="h-[220px] sm:h-[260px]"
              disabled={saving}
            />

            <DocumentImageUploadField
              label={t("business.profile.idBack")}
              required
              value={documentFiles.idCardBack}
              onChange={(files) =>
                setDocumentFiles((prev) => ({
                  ...prev,
                  idCardBack: files,
                }))
              }
              hint={t("business.profile.idBackHint")}
              fallbackPreview={
                existingDocumentPreviews.idCardBack ||
                DOCUMENT_SAMPLE_IMAGES.idCardBack
              }
              previewAlt={t("business.profile.altIdBack")}
              previewClassName="h-[220px] sm:h-[260px]"
              disabled={saving}
            />
          </div>
        </div>
      </div>
    </BusinessSectionCard>
  );
};

export default ProfileEditDocumentsSection;
