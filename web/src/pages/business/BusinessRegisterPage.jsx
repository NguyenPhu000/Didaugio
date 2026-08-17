// MAP: BusinessRegisterPage
// ├── UI: @/components/business/register/{StepIndicator, BusinessInfoStep, BankInfoStep, DocumentUploadStep, ContractSignStep}
// └── API: @/hooks/queries/useBusinessQueries, @/apis/businessApi

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
  FileSignature,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useBusinessProfile,
  useRegisterBusiness,
} from "@/hooks/queries/useBusinessQueries";
import businessApi from "@/apis/businessApi";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { BUSINESS_STATUS } from "@/constants/businessConstants";
import { ROLES } from "@/constants/constants";
import { useAuthStore } from "@/stores/authStore";
import {
  BusinessPageHeader,
  BusinessSectionCard,
} from "@/components/business/ui";
import ContractSignModal from "@/components/business/ContractSignModal";

// Extracted Sub-Components
import StepIndicator from "@/components/business/register/StepIndicator";
import BusinessInfoStep from "@/components/business/register/BusinessInfoStep";
import BankInfoStep from "@/components/business/register/BankInfoStep";
import DocumentUploadStep from "@/components/business/register/DocumentUploadStep";
import ContractSignStep from "@/components/business/register/ContractSignStep";

const registerSchema = z.object({
  businessName: z.string().min(2),
  businessType: z.enum(["individual", "household", "company"]),
  taxCode: z.string().optional(),
  idCardNumber: z.string().min(9).max(12),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountOwner: z.string().optional(),
});

const STEPS = [
  { key: "info", icon: Store, labelKey: "business.register.stepInfo" },
  { key: "bank", icon: CreditCard, labelKey: "business.register.stepBank" },
  { key: "docs", icon: FileText, labelKey: "business.register.stepDocs" },
  { key: "contract", icon: FileSignature, labelKey: "Ký hợp đồng" },
];

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
  const [signOpen, setSignOpen] = useState(false);
  const [contractPayload, setContractPayload] = useState(null);
  const signedContract = Boolean(contractPayload);
  const authUser = useAuthStore((state) => state.user);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
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
    if (currentStep === 2) {
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
        return false;
      }
      return true;
    }
    return true;
  }, [currentStep, trigger, documents, t]);

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
    if (!contractPayload) {
      toast.error(
        "Vui lòng thực hiện ký hợp đồng điện tử trước khi gửi đăng ký!"
      );
      return;
    }

    try {
      await registerMutation.mutateAsync({
        ...data,
        fullName: contractPayload.fullName,
        phone: contractPayload.phone,
        address: contractPayload.address,
        idCardFront: documents.idCardFront[0],
        idCardBack: documents.idCardBack[0],
        businessLicense: documents.businessLicense[0],
      });
      toast.success(t("business.register.title"));
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setSession({
          user: { ...currentUser, roleId: ROLES.BUSINESS },
        });
      }

      try {
        await businessApi.contractSign(contractPayload);
      } catch (signError) {
        console.error("Business contract signing error:", signError);
        toast.warning(
          "Đăng ký thành công nhưng chưa lưu được hợp đồng điện tử. Vui lòng ký lại trong mục Hồ sơ doanh nghiệp."
        );
      }

      navigate(BUSINESS_ROUTES.WELCOME, { replace: true });
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t("common.operationFailed");
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
                <BusinessInfoStep
                  register={register}
                  errors={errors}
                  selectedBusinessType={selectedBusinessType}
                  setValue={setValue}
                />
              )}

              {/* Step 2: Bank Info */}
              {currentStep === 1 && <BankInfoStep register={register} />}

              {/* Step 3: Documents */}
              {currentStep === 2 && (
                <DocumentUploadStep
                  documents={documents}
                  setDocuments={setDocuments}
                  documentErrors={documentErrors}
                  setDocumentErrors={setDocumentErrors}
                  isLoading={isLoading}
                />
              )}

              {/* Step 4: Contract */}
              {currentStep === 3 && (
                <ContractSignStep
                  signedContract={signedContract}
                  setSignOpen={setSignOpen}
                />
              )}
            </BusinessSectionCard>

            {/* Navigation Buttons */}
            <div className="mt-6 flex items-center justify-between gap-4">
              {currentStep > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="gap-2 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("common.back")}
                </Button>
              ) : (
                <div />
              )}

              {currentStep < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="gap-2 cursor-pointer"
                >
                  {t("common.next")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="gap-2 bg-[#F3E600] text-black font-bold border border-black hover:bg-black hover:text-[#F3E600] cursor-pointer"
                >
                  {isLoading
                    ? t("business.register.submitting")
                    : "Tạo & Hoàn tất đăng ký"}
                  {!isLoading && <Check className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </form>
        </>
      )}

      <ContractSignModal
        open={signOpen}
        onOpenChange={setSignOpen}
        onSubmit={async (payload) => {
          setContractPayload(payload);
          setSignOpen(false);
          toast.success("Ký hợp đồng điện tử thành công!");
        }}
        loading={false}
        contractVersion="v1"
        business={{
          businessName: watch("businessName") || "Doanh nghiệp mới",
          taxCode: watch("taxCode") || "",
          idCardNumber: watch("idCardNumber") || "",
          owner: { email: authUser?.email || "" },
        }}
      />
    </div>
  );
};

export default BusinessRegisterPage;
