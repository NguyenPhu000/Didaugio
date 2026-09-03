import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import DocumentImageUploadField from "@/components/business/DocumentImageUploadField";
import { DOCUMENT_SAMPLE_IMAGES } from "@/components/business/documentImageConstants";

export const DocumentUploadStep = memo(
  ({ documents, setDocuments, documentErrors, setDocumentErrors, isLoading }) => {
    const { t } = useTranslation();

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
          <h4 className="text-sm font-semibold text-foreground">
            {t("business.register.documentsTitle")}
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("business.register.documentsDesc")}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <DocumentImageUploadField
              label={t("business.register.businessLicense")}
              required
              value={documents.businessLicense}
              onChange={(files) => {
                setDocuments((prev) => ({
                  ...prev,
                  businessLicense: files,
                }));
                setDocumentErrors((prev) => ({
                  ...prev,
                  businessLicense: "",
                }));
              }}
              hint={t("business.register.licenseHint")}
              fallbackPreview={DOCUMENT_SAMPLE_IMAGES.businessLicense}
              previewAlt={t("business.register.altBusinessLicense")}
              previewClassName="h-[300px] sm:h-[360px]"
              error={documentErrors.businessLicense}
              disabled={isLoading}
            />

            <DocumentImageUploadField
              label={t("business.register.idFront")}
              required
              value={documents.idCardFront}
              onChange={(files) => {
                setDocuments((prev) => ({ ...prev, idCardFront: files }));
                setDocumentErrors((prev) => ({ ...prev, idCardFront: "" }));
              }}
              hint={t("business.register.idFrontHint")}
              fallbackPreview={DOCUMENT_SAMPLE_IMAGES.idCardFront}
              previewAlt={t("business.register.altIdFront")}
              previewClassName="h-[220px] sm:h-[260px]"
              error={documentErrors.idCardFront}
              disabled={isLoading}
            />

            <DocumentImageUploadField
              label={t("business.register.idBack")}
              required
              value={documents.idCardBack}
              onChange={(files) => {
                setDocuments((prev) => ({ ...prev, idCardBack: files }));
                setDocumentErrors((prev) => ({ ...prev, idCardBack: "" }));
              }}
              hint={t("business.register.idBackHint")}
              fallbackPreview={DOCUMENT_SAMPLE_IMAGES.idCardBack}
              previewAlt={t("business.register.altIdBack")}
              previewClassName="h-[220px] sm:h-[260px]"
              error={documentErrors.idCardBack}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    );
  }
);

DocumentUploadStep.displayName = "DocumentUploadStep";
export default DocumentUploadStep;
