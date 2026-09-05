// MAP: BusinessProfilePage
// ├── UI: @/components/business/profile/{ProfileHeaderCard, ProfileGeneralTab, ProfileSecurityTab, ProfileVerificationTab}
// └── API: @/apis/businessApi, @/apis/authApi

import { useEffect, useMemo, useRef, useState, memo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import { Edit3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBusinessProfile,
  useUpdateBusinessProfile,
} from "@/hooks/queries/useBusinessQueries";
import * as businessApi from "@/apis/businessApi";
import { BUSINESS_STATUS } from "@/constants/businessConstants";
import { BusinessPageHeader } from "@/components/business/ui";
import ContractSignModal from "@/components/business/ContractSignModal";

// Extracted Sub-Components
import ProfileStatusBanner from "@/components/business/profile/ProfileStatusBanner";
import ProfilePasswordVerifyModal from "@/components/business/profile/ProfilePasswordVerifyModal";
import ProfileOverviewGrid from "@/components/business/profile/ProfileOverviewGrid";
import ProfileEditForm from "@/components/business/profile/ProfileEditForm";

const profileSchema = z.object({
  businessName: z.string().min(2),
  businessType: z.enum(["individual", "household", "company"]),
  taxCode: z.string().optional().nullable(),
  idCardNumber: z.string().min(9).max(12),
  bankName: z.string().optional().nullable(),
  bankAccountNumber: z.string().optional().nullable(),
  bankAccountOwner: z.string().optional().nullable(),
});

const getBusinessTypes = (t) => [
  { value: "individual", label: t("business.profile.businessTypeIndividual") },
  { value: "household", label: t("business.profile.businessTypeHousehold") },
  { value: "company", label: t("business.profile.businessTypeCompany") },
];

const ProfileSkeleton = () => (
  <div className="space-y-6 p-6 lg:p-8">
    <Skeleton className="h-8 w-64" />
    <div className="grid lg:grid-cols-2 gap-4">
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  </div>
);

const BusinessProfilePage = memo(() => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const contractSectionRef = useRef(null);
  const { data: profileResponse, isLoading: loading, refetch: fetchProfile } = useBusinessProfile();
  const business = profileResponse?.data || profileResponse;

  const updateProfileMutation = useUpdateBusinessProfile();
  const updateProfile = async (data) => {
    return await updateProfileMutation.mutateAsync(data);
  };
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [signing, setSigning] = useState(false);
  const [documentFiles, setDocumentFiles] = useState({
    idCardFront: [],
    idCardBack: [],
    businessLicense: [],
  });

  const [decryptedData, setDecryptedData] = useState(null);
  const [showDecrypted, setShowDecrypted] = useState(false);
  const [confirmPasswordOpen, setConfirmPasswordOpen] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const handleVerifyPassword = async () => {
    setVerifying(true);
    try {
      const res = await businessApi.decryptProfile({ password: verifyPassword });
      const decData = res.data || res;
      setDecryptedData(decData);
      setShowDecrypted(true);
      setConfirmPasswordOpen(false);
      setVerifyPassword("");
      toast.success("Xác thực thành công. Đã hiển thị dữ liệu giải mã.");

      if (pendingAction === "signContract") {
        setSignOpen(true);
        setPendingAction(null);
      }
    } catch (error) {
      toast.error(error?.message || "Mật khẩu không chính xác");
    } finally {
      setVerifying(false);
    }
  };

  const toggleShowDecrypted = () => {
    if (showDecrypted) {
      setShowDecrypted(false);
    } else if (decryptedData) {
      setShowDecrypted(true);
    } else {
      setConfirmPasswordOpen(true);
    }
  };

  const BUSINESS_TYPES = getBusinessTypes(t);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (business) {
      const info = business.businessInfo || business;
      reset({
        businessName: info.businessName || business.businessName || "",
        businessType: info.businessType || business.businessType || "individual",
        taxCode: info.taxCode || business.taxCode || "",
        idCardNumber: info.idCardNumber || business.idCardNumber || "",
        bankName: info.bankName || business.bankName || "",
        bankAccountNumber: info.bankAccountNumber || business.bankAccountNumber || "",
        bankAccountOwner: info.bankAccountOwner || business.bankAccountOwner || "",
      });
    }
  }, [business, reset]);

  useEffect(() => {
    if (business?.status === BUSINESS_STATUS.SUSPENDED) setIsEditing(false);
  }, [business?.status]);

  useEffect(() => {
    if (searchParams.get("section") !== "contract" || !business) return;
    const id = requestAnimationFrame(() => {
      contractSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [searchParams, business]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await updateProfile({
        ...data,
        ...(documentFiles.idCardFront[0]
          ? { idCardFront: documentFiles.idCardFront[0] }
          : {}),
        ...(documentFiles.idCardBack[0]
          ? { idCardBack: documentFiles.idCardBack[0] }
          : {}),
        ...(documentFiles.businessLicense[0]
          ? { businessLicense: documentFiles.businessLicense[0] }
          : {}),
      });
      toast.success(t("business.profile.title"));
      reset(data);
      setDocumentFiles({
        idCardFront: [],
        idCardBack: [],
        businessLicense: [],
      });
      setIsEditing(false);
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.profile.loadFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    reset();
    setDocumentFiles({ idCardFront: [], idCardBack: [], businessLicense: [] });
    setIsEditing(false);
  };

  const bInfo = useMemo(() => business?.businessInfo || business || {}, [business]);
  const businessTypeLabel = BUSINESS_TYPES.find(
    (t) => t.value === (bInfo?.businessType || business?.businessType)
  )?.label;

  const basicInfoRows = useMemo(
    () => [
      { label: t("business.profile.displayBusinessName"), value: bInfo?.businessName || business?.businessName },
      { label: t("business.profile.displayBusinessType"), value: businessTypeLabel },
      {
        label: t("business.profile.displayIdCardNumber"),
        value: showDecrypted ? decryptedData?.idCardNumber : (bInfo?.idCardNumber || business?.idCardNumberMasked || business?.idCardNumber),
        isSensitive: true,
      },
      {
        label: t("business.profile.displayTaxCode"),
        value: showDecrypted ? decryptedData?.taxCode : (bInfo?.taxCode || business?.taxCodeMasked || business?.taxCode),
        isSensitive: true,
      },
    ],
    [bInfo, business, businessTypeLabel, showDecrypted, decryptedData, t]
  );

  const bankInfoRows = useMemo(
    () => [
      { label: t("business.profile.displayBankName"), value: bInfo?.bankName || business?.bankName },
      {
        label: t("business.profile.displayBankAccount"),
        value: showDecrypted ? decryptedData?.bankAccountNumber : (bInfo?.bankAccountNumber || business?.bankAccountNumberMasked || business?.bankAccountNumber),
        isSensitive: true,
      },
      {
        label: t("business.profile.displayAccountHolder"),
        value: showDecrypted ? decryptedData?.bankAccountOwner : (bInfo?.bankAccountOwner || business?.bankAccountOwnerMasked || business?.bankAccountOwner),
        isSensitive: true,
      },
    ],
    [bInfo, business, showDecrypted, decryptedData, t]
  );

  const hasDocumentChanges = useMemo(
    () =>
      documentFiles.idCardFront.length > 0 ||
      documentFiles.idCardBack.length > 0 ||
      documentFiles.businessLicense.length > 0,
    [documentFiles]
  );

  const existingDocumentPreviews = useMemo(
    () => ({
      businessLicense: business?.businessLicense || null,
      idCardFront: business?.idCardFront || null,
      idCardBack: business?.idCardBack || null,
    }),
    [business?.businessLicense, business?.idCardFront, business?.idCardBack]
  );

  if (loading) return <ProfileSkeleton />;

  const isSuspended = business?.status === BUSINESS_STATUS.SUSPENDED;
  const canSignContract =
    (business?.status === BUSINESS_STATUS.APPROVED || business?.status === BUSINESS_STATUS.PENDING) &&
    !business?.contractSigned;

  const handleSignContract = async (payload) => {
    setSigning(true);
    try {
      await businessApi.contractSign(payload);
      await fetchProfile();
      toast.success(t("business.profile.contractSigned"));
      setSignOpen(false);
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.profile.contractSignFailed"));
      throw error;
    } finally {
      setSigning(false);
    }
  };

  let headerAction = null;
  if (!isSuspended) {
    if (!isEditing) {
      headerAction = (
        <Button onClick={() => setIsEditing(true)} className="gap-2 rounded-2xl">
          <Edit3 className="h-4 w-4" />
          {t("business.profile.edit")}
        </Button>
      );
    } else {
      headerAction = (
        <Button variant="outline" onClick={handleCancel} className="gap-2 rounded-2xl">
          <X className="h-4 w-4" />
          {t("business.profile.cancel")}
        </Button>
      );
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <BusinessPageHeader
        title={t("business.profile.title")}
        description={t("business.profile.title")}
        action={headerAction}
      />

      {/* Status Banner */}
      <ProfileStatusBanner
        status={business?.status}
        reason={business?.rejectionReason}
      />

      {!isEditing ? (
        <ProfileOverviewGrid
          basicInfoRows={basicInfoRows}
          bankInfoRows={bankInfoRows}
          showDecrypted={showDecrypted}
          onToggleShowDecrypted={toggleShowDecrypted}
          business={business}
          contractSectionRef={contractSectionRef}
          canSignContract={canSignContract}
          onInitiateSignContract={() => {
            if (!decryptedData) {
              setPendingAction("signContract");
              setConfirmPasswordOpen(true);
            } else {
              setSignOpen(true);
            }
          }}
        />
      ) : (
        <ProfileEditForm
          register={register}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          errors={errors}
          watch={watch}
          setValue={setValue}
          businessTypes={BUSINESS_TYPES}
          documentFiles={documentFiles}
          setDocumentFiles={setDocumentFiles}
          existingDocumentPreviews={existingDocumentPreviews}
          saving={saving}
          isDirty={isDirty}
          hasDocumentChanges={hasDocumentChanges}
          onCancel={handleCancel}
        />
      )}

      {/* Password verification modal */}
      <ProfilePasswordVerifyModal
        open={confirmPasswordOpen}
        onOpenChange={setConfirmPasswordOpen}
        verifyPassword={verifyPassword}
        setVerifyPassword={setVerifyPassword}
        onVerifyPassword={handleVerifyPassword}
        verifying={verifying}
      />

      <ContractSignModal
        open={signOpen}
        onOpenChange={setSignOpen}
        onSubmit={handleSignContract}
        loading={signing}
        contractVersion={business?.contractVersion || "v1"}
        business={business}
        decryptedData={decryptedData}
      />
    </div>
  );
});

BusinessProfilePage.displayName = "BusinessProfilePage";
export default BusinessProfilePage;
