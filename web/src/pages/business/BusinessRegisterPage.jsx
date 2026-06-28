import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import {
  Store,
  CreditCard,
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
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
import {
  useBusinessProfile,
  useRegisterBusiness,
} from "@/hooks/queries/useBusinessQueries";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { BUSINESS_STATUS } from "@/constants/businessConstants";
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

const STEPS = [
  { key: "info", icon: Store, labelKey: "business.register.stepInfo" },
  { key: "bank", icon: CreditCard, labelKey: "business.register.stepBank" },
  { key: "docs", icon: FileText, labelKey: "business.register.stepDocs" },
];

function StepIndicator({ currentStep, steps }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx === currentStep;
        const isCompleted = idx < currentStep;
        const stepClassName = isActive
          ? "bg-primary text-primary-foreground shadow-md"
          : "";
        const completedClassName = isCompleted
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-muted text-muted-foreground";

        return (
          <div key={step.key} className="flex items-center">
            <div
              className={`
                flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all
                ${stepClassName || completedClassName}
              `}
            >
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{t(step.labelKey)}</span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`mx-2 h-px w-8 ${
                  idx < currentStep ? "bg-emerald-300" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

const BusinessRegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const registerMutation = useRegisterBusiness();
  const { data: businessProfile, isLoading: isProfileLoading } =
    useBusinessProfile();
  const [currentStep, setCurrentStep] = useState(0);
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
    control,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { businessType: "individual" },
  });
  const selectedBusinessType = useWatch({ control, name: "businessType" });

  const isLoading = registerMutation.isPending;

  useEffect(() => {
    const profile = businessProfile?.data || businessProfile;
    if (!profile) return;

    if (profile.status === BUSINESS_STATUS.APPROVED) {
      navigate(BUSINESS_ROUTES.DASHBOARD, { replace: true });
      return;
    }

    navigate(BUSINESS_ROUTES.WELCOME, { replace: true });
  }, [businessProfile, navigate]);

  const canGoNext = useCallback(async () => {
    if (currentStep === 0) {
      return await trigger(["businessName", "businessType", "idCardNumber"]);
    }
    if (currentStep === 1) {
      return true; // Bank info is optional
    }
    return true;
  }, [currentStep, trigger]);

  const handleNext = async () => {
    const valid = await canGoNext();
    if (valid && currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

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
      navigate(BUSINESS_ROUTES.WELCOME);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t("common.operationFailed");
      const errorCode = error?.errorCode || error?.response?.data?.errorCode;

      console.error("Business registration error:", {
        message: errorMessage,
        errorCode,
        status: error?.status || error?.response?.status,
        data: error?.data || error?.response?.data,
      });

      toastApiErrorIfNeeded(error, errorMessage);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 lg:p-8 min-h-screen">
      {isProfileLoading ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-black" />
        </div>
      ) : (
        <>
      <BusinessPageHeader
        title={t("business.register.title")}
        description={t("business.register.description")}
      />

      <StepIndicator currentStep={currentStep} steps={STEPS} />

      <form onSubmit={handleSubmit(onSubmit)}>
        <BusinessSectionCard
          title={t(STEPS[currentStep].labelKey)}
          titleIcon={STEPS[currentStep].icon}
        >
          <input type="hidden" {...register("businessType")} />

          {/* Step 1: Business Info */}
          {currentStep === 0 && (
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
          )}

          {/* Step 2: Bank Info */}
          {currentStep === 1 && (
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
          )}

          {/* Step 3: Documents */}
          {currentStep === 2 && (
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
            </div>
          )}
        </BusinessSectionCard>

        {/* Navigation Buttons */}
        <div className="mt-6 flex items-center justify-between gap-4">
          {currentStep > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("common.back")}
            </Button>
          ) : (
            <div />
          )}

          {currentStep < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext} className="gap-2">
              {t("common.next")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? t("business.register.submitting") : t("business.register.submit")}
              {!isLoading && <Check className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </form>
        </>
      )}
    </div>
  );
};

export default BusinessRegisterPage;
