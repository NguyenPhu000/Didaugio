import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import {
  Save,
  CreditCard,
  Building2,
  FileSignature,
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit3,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useBusinessStore from "@/stores/businessStore";
import * as businessApi from "@/apis/businessApi";
import { BUSINESS_STATUS } from "@/constants/businessConstants";
import {
  BusinessSectionCard,
  BusinessPageHeader,
} from "@/components/business/ui";
import { BUSINESS_TOKENS } from "@/components/business/tokens";
import { cn } from "@/lib/utils";
import ContractSignModal from "@/components/business/ContractSignModal";
import DocumentImageUploadField from "@/components/business/DocumentImageUploadField";
import { DOCUMENT_SAMPLE_IMAGES } from "@/components/business/documentImageConstants";
import { isImageSource, resolveMediaUrl } from "@/utils/mediaUrl";

// ─── Validation Schema ────────────────────────────────────────────────────────

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

// ─── Status Banner ─────────────────────────────────────────────────────────────

const getStatusConfig = (t) => ({
  pending: {
    icon: Clock,
    label: t("business.profile.statusPending"),
    description: t("business.profile.statusDescriptionPending"),
    className: "bg-amber-50 border-amber-200 text-amber-800",
    iconClass: "text-amber-600",
  },
  approved: {
    icon: CheckCircle2,
    label: t("business.profile.statusApproved"),
    description: t("business.profile.statusDescriptionApproved"),
    className: "bg-emerald-50 border-emerald-200 text-emerald-800",
    iconClass: "text-emerald-600",
  },
  rejected: {
    icon: AlertCircle,
    label: t("business.profile.statusRejected"),
    description: t("business.profile.statusDescriptionRejected"),
    className: "bg-red-50 border-red-200 text-red-800",
    iconClass: "text-red-600",
  },
  suspended: {
    icon: AlertCircle,
    label: t("business.profile.statusSuspended"),
    description: t("business.profile.statusDescriptionSuspended"),
    className: "bg-slate-100 border-slate-300 text-slate-800",
    iconClass: "text-slate-600",
  },
});

const StatusBanner = ({ status, reason }) => {
  const { t } = useTranslation();
  if (!status) return null;
  const statusConfig = getStatusConfig(t);
  const cfg = statusConfig[status] || statusConfig.pending;
  const StatusIcon = cfg.icon;
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border",
        cfg.className,
      )}
    >
      <StatusIcon className={cn("h-5 w-5 shrink-0 mt-0.5", cfg.iconClass)} />
      <div>
        <p className="text-sm font-semibold">{cfg.label}</p>
        <p className="text-xs opacity-80 mt-0.5">{cfg.description}</p>
        {status === "rejected" && reason && (
          <div className="mt-2 text-xs p-2 bg-white/60 rounded-md border border-current/20">
            <strong>{t("business.profile.rejectReason")}</strong> {reason}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Form Field ────────────────────────────────────────────────────────────────

const FormField = ({ label, error, required, children }) => (
  <div className="space-y-1.5">
    <Label className="flex items-center gap-1">
      {label}
      {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
    {error && <p className="text-[11px] text-destructive">{error}</p>}
  </div>
);

const resolveImagePreview = (raw) => {
  const resolved = resolveMediaUrl(raw);
  return isImageSource(resolved) ? resolved : null;
};

const DocumentPreviewCard = ({ label, src, alt, previewClassName }) => (
  <div className="rounded-lg border border-border/60 p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <div
      className={cn(
        "mt-2 overflow-hidden rounded-md border border-border/60 bg-muted/30",
        previewClassName,
      )}
    >
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    </div>
  </div>
);

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const ProfileSkeleton = () => (
  <div className="space-y-6 p-6 lg:p-8">
    <Skeleton className="h-8 w-64" />
    <div className="grid lg:grid-cols-2 gap-4">
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const BusinessProfilePage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const contractSectionRef = useRef(null);
  const { business, loading, updateProfile, fetchProfile } = useBusinessStore();
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [signing, setSigning] = useState(false);
  const [documentFiles, setDocumentFiles] = useState({
    idCardFront: [],
    idCardBack: [],
    businessLicense: [],
  });

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
      reset({
        businessName: business.businessName || "",
        businessType: business.businessType || "individual",
        taxCode: business.taxCode || "",
        idCardNumber: business.idCardNumber || "",
        bankName: business.bankName || "",
        bankAccountNumber: business.bankAccountNumber || "",
        bankAccountOwner: business.bankAccountOwner || "",
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

  const businessTypeLabel = BUSINESS_TYPES.find(
    (t) => t.value === business?.businessType,
  )?.label;
  const basicInfoRows = useMemo(
    () => [
      { label: t("business.profile.displayBusinessName"), value: business?.businessName },
      { label: t("business.profile.displayBusinessType"), value: businessTypeLabel },
      { label: t("business.profile.displayIdNumber"), value: business?.idCardNumber },
      { label: t("business.profile.displayTaxCode"), value: business?.taxCode },
    ],
    [
      business?.businessName,
      business?.idCardNumber,
      business?.taxCode,
      businessTypeLabel,
      t,
    ],
  );
  const bankInfoRows = useMemo(
    () => [
      { label: t("business.profile.displayBankName"), value: business?.bankName },
      { label: t("business.profile.displayBankAccount"), value: business?.bankAccountNumber },
      { label: t("business.profile.displayAccountHolder"), value: business?.bankAccountOwner },
    ],
    [
      business?.bankAccountNumber,
      business?.bankAccountOwner,
      business?.bankName,
      t,
    ],
  );
  const hasDocumentChanges = useMemo(
    () =>
      documentFiles.idCardFront.length > 0 ||
      documentFiles.idCardBack.length > 0 ||
      documentFiles.businessLicense.length > 0,
    [documentFiles],
  );
  const existingDocumentPreviews = useMemo(
    () => ({
      idCardFront: resolveImagePreview(business?.idCardFront),
      idCardBack: resolveImagePreview(business?.idCardBack),
      businessLicense: resolveImagePreview(business?.businessLicense),
    }),
    [business?.businessLicense, business?.idCardBack, business?.idCardFront],
  );
  const previewSources = useMemo(
    () => ({
      portrait:
        existingDocumentPreviews.businessLicense ||
        DOCUMENT_SAMPLE_IMAGES.portrait,
      idCardFront:
        existingDocumentPreviews.idCardFront ||
        DOCUMENT_SAMPLE_IMAGES.idCardFront,
      idCardBack:
        existingDocumentPreviews.idCardBack ||
        DOCUMENT_SAMPLE_IMAGES.idCardBack,
    }),
    [existingDocumentPreviews],
  );

  if (loading) return <ProfileSkeleton />;

  const isSuspended = business?.status === BUSINESS_STATUS.SUSPENDED;
  const canSignContract =
    business?.status === BUSINESS_STATUS.APPROVED && !business?.contractSigned;

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
        <Button onClick={() => setIsEditing(true)} className="gap-2">
          <Edit3 className="h-4 w-4" />
          {t("business.profile.edit")}
        </Button>
      );
    } else {
      headerAction = (
        <Button variant="outline" onClick={handleCancel} className="gap-2">
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
      <StatusBanner
        status={business?.status}
        reason={business?.rejectionReason}
      />

      {!isEditing ? (
        /* View Mode */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BusinessSectionCard title={t("business.profile.basicInfo")} titleIcon={Building2}>
            <div className="space-y-0">
              {basicInfoRows.map(({ label, value }) => (
                <div
                  key={label}
                  className="flex flex-col sm:flex-row sm:items-start sm:justify-between py-2.5 border-b border-border/50 last:border-0 gap-1"
                >
                  <span className="text-xs text-muted-foreground sm:w-36 shrink-0">
                    {label}
                  </span>
                  <span className="text-sm font-medium text-foreground sm:text-right">
                    {value || (
                      <span className="text-muted-foreground/50 italic text-xs">
                        {t("business.profile.notUpdated")}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </BusinessSectionCard>

          <BusinessSectionCard title={t("business.profile.bankInfo")} titleIcon={CreditCard}>
            <div className="space-y-0">
              {bankInfoRows.map(({ label, value }) => (
                <div
                  key={label}
                  className="flex flex-col sm:flex-row sm:items-start sm:justify-between py-2.5 border-b border-border/50 last:border-0 gap-1"
                >
                  <span className="text-xs text-muted-foreground sm:w-36 shrink-0">
                    {label}
                  </span>
                  <span className="text-sm font-medium text-foreground sm:text-right">
                    {value || (
                      <span className="text-muted-foreground/50 italic text-xs">
                        {t("business.profile.notUpdated")}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </BusinessSectionCard>

          <BusinessSectionCard
            title={t("business.profile.documents")}
            titleIcon={CheckCircle2}
            className="lg:col-span-2"
          >
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {t("business.profile.documentsDefaultNote")}
              </p>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <DocumentPreviewCard
                  label={t("business.profile.businessLicense")}
                  src={previewSources.portrait}
                  alt={t("business.profile.altBusinessLicense")}
                  previewClassName="h-[300px] sm:h-[360px]"
                />
                <DocumentPreviewCard
                  label={t("business.profile.idFront")}
                  src={previewSources.idCardFront}
                  alt={t("business.profile.altIdFront")}
                  previewClassName="h-[220px] sm:h-[260px]"
                />
                <DocumentPreviewCard
                  label={t("business.profile.idBack")}
                  src={previewSources.idCardBack}
                  alt={t("business.profile.altIdBack")}
                  previewClassName="h-[220px] sm:h-[260px]"
                />
              </div>
            </div>
          </BusinessSectionCard>

          <div
            ref={contractSectionRef}
            id="business-contract-section"
            className="scroll-mt-24 lg:col-span-2"
          >
            <BusinessSectionCard title={t("business.profile.contract")} titleIcon={FileSignature}>
              <div className="space-y-3">
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">
                    {t("business.profile.contractStatus")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
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
                      {new Date(business.contractSignedAt).toLocaleString(
                        "vi-VN",
                      )}
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setSignOpen(true)}
                  disabled={!canSignContract}
                >
                  {business?.contractSigned
                    ? t("business.profile.contractCompleted")
                    : t("business.profile.signContract")}
                </Button>
              </div>
            </BusinessSectionCard>
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Basic Info */}
            <BusinessSectionCard title={t("business.profile.basicInfo")} titleIcon={Building2}>
              <div className="space-y-4">
                <FormField
                  label={t("business.profile.businessName")}
                  required
                  error={errors.businessName?.message}
                >
                  <Input
                    {...register("businessName")}
                    placeholder={t("business.profile.businessNameExample")}
                  />
                </FormField>

                <FormField label={t("business.profile.businessType")}>
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
                      {BUSINESS_TYPES.map((bt) => (
                        <SelectItem key={bt.value} value={bt.value}>
                          {bt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    label={t("business.profile.idNumber")}
                    required
                    error={errors.idCardNumber?.message}
                  >
                    <Input
                      {...register("idCardNumber")}
                      placeholder={t("business.profile.idCardPlaceholder")}
                    />
                  </FormField>
                  <FormField label={t("business.profile.taxCode")} error={errors.taxCode?.message}>
                    <Input {...register("taxCode")} placeholder={t("business.profile.taxCodePlaceholder")} />
                  </FormField>
                </div>
              </div>
            </BusinessSectionCard>

            {/* Bank Info */}
            <BusinessSectionCard title={t("business.profile.bankInfo")} titleIcon={CreditCard}>
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>
                    {t("business.profile.bankInfoDesc")}
                  </p>
                </div>

                <FormField label={t("business.profile.bankName")}>
                  <Input
                    {...register("bankName")}
                    placeholder={t("business.profile.bankNamePlaceholder")}
                  />
                </FormField>

                <FormField label={t("business.profile.bankAccount")}>
                  <Input
                    {...register("bankAccountNumber")}
                    placeholder={t("business.profile.bankAccountPlaceholder")}
                  />
                </FormField>

                <FormField label={t("business.profile.accountHolder")}>
                  <Input
                    {...register("bankAccountOwner")}
                    placeholder={t("business.profile.accountHolderPlaceholder")}
                  />
                </FormField>
              </div>
            </BusinessSectionCard>

            <BusinessSectionCard
              title={t("business.profile.updateDocuments")}
              titleIcon={CheckCircle2}
              className="lg:col-span-2"
            >
              <div className="space-y-4">
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <h4 className="text-sm font-semibold text-foreground">
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
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-6 z-50">
            <div
              className={cn(
                BUSINESS_TOKENS.card,
                "p-3 flex items-center justify-between gap-3",
              )}
            >
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                {isDirty ? (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-amber-600">
                      {t("business.profile.unsavedChanges")}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-600">
                      {t("business.profile.allSaved")}
                    </span>
                  </>
                )}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  {t("business.profile.discard")}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving || (!isDirty && !hasDocumentChanges)}
                  className="gap-2"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? t("business.profile.saving") : t("business.profile.saveChanges")}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      <ContractSignModal
        open={signOpen}
        onOpenChange={setSignOpen}
        onSubmit={handleSignContract}
        loading={signing}
        contractVersion={business?.contractVersion || "v1"}
      />
    </div>
  );
};

export default BusinessProfilePage;
