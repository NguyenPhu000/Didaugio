import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import { Store, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRegisterBusiness } from "@/hooks/queries/useBusinessQueries";
import { BUSINESS_ROUTES } from "@/constants/routes";
import {
  BusinessPageHeader,
  BusinessSectionCard,
} from "@/components/business/ui";
import DocumentImageUploadField from "@/components/business/DocumentImageUploadField";
import { DOCUMENT_SAMPLE_IMAGES } from "@/components/business/documentImageConstants";

const registerSchema = z.object({
  businessName: z.string().min(2),
  businessType: z.enum(["individual", "household", "company"]),
  taxCode: z.string().optional(),
  idCardNumber: z.string().min(9).max(12),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountOwner: z.string().optional(),
});

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

const BusinessRegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const registerMutation = useRegisterBusiness();
  const [documents, setDocuments] = useState({
    idCardFront: [],
    idCardBack: [],
    businessLicense: [],
  });
  const [documentErrors, setDocumentErrors] = useState({});

  const BUSINESS_TYPES = [
    { value: "individual", label: t("business.register.businessTypeIndividual") },
    { value: "household", label: t("business.register.businessTypeHousehold") },
    { value: "company", label: t("business.register.businessTypeCompany") },
  ];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { businessType: "individual" },
  });

  const isLoading = registerMutation.isPending;

  const onSubmit = async (data) => {
    const nextErrors = {
      businessLicense:
        documents.businessLicense.length === 0
          ? t("business.register.errorBusinessLicense")
          : "",
      idCardFront:
        documents.idCardFront.length === 0
          ? t("business.register.errorIdCardFront")
          : "",
      idCardBack:
        documents.idCardBack.length === 0
          ? t("business.register.errorIdCardBack")
          : "",
    };

    setDocumentErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      toast.error(t("business.register.errorAllDocuments"));
      return;
    }

    try {
      await registerMutation.mutateAsync({
        ...data,
        idCardFront: documents.idCardFront[0],
        idCardBack: documents.idCardBack[0],
        businessLicense: documents.businessLicense[0],
      });
      toast.success(t("business.register.title"));
      navigate(BUSINESS_ROUTES.PROFILE);
    } catch (error) {
      toastApiErrorIfNeeded(error, t("common.operationFailed"));
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 lg:p-8 min-h-screen">
      <BusinessPageHeader
        title={t("business.register.title")}
        description={t("business.register.title")}
      />

      <BusinessSectionCard title={t("business.register.registrationInfo")} titleIcon={Store}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("businessType")} />

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
              value={watch("businessType")}
              onValueChange={(v) =>
                setValue("businessType", v, { shouldDirty: true })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
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
              <Input {...register("idCardNumber")} placeholder={t("business.register.idCardPlaceholder")} />
            </FormField>
            <FormField label={t("business.register.taxCode")} error={errors.taxCode?.message}>
              <Input {...register("taxCode")} placeholder={t("business.register.taxCodePlaceholder")} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label={t("business.register.bankName")}>
              <Input {...register("bankName")} placeholder={t("business.register.bankNamePlaceholder")} />
            </FormField>
            <FormField label={t("business.register.bankAccount")}>
              <Input {...register("bankAccountNumber")} />
            </FormField>
            <FormField label={t("business.register.accountHolder")}>
              <Input {...register("bankAccountOwner")} />
            </FormField>
          </div>

          <BusinessSectionCard title={t("business.register.documents")} bodyClassName="space-y-4">
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
                  fallbackPreview={DOCUMENT_SAMPLE_IMAGES.portrait}
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
          </BusinessSectionCard>

          <Button type="submit" disabled={isLoading} className="w-full gap-2">
            {isLoading ? t("business.register.submitting") : t("business.register.submit")}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>
      </BusinessSectionCard>
    </div>
  );
};

export default BusinessRegisterPage;
