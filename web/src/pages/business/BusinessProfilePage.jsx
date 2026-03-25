import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
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
  SectionCard,
  PageHeader,
  DESIGN,
} from "@/components/business/DashboardWidgets";
import { cn } from "@/lib/utils";
import FileUploader from "@/components/business/FileUploader";
import ContractSignModal from "@/components/business/ContractSignModal";

// ─── Validation Schema ────────────────────────────────────────────────────────

const profileSchema = z.object({
  businessName: z.string().min(2, "Tên doanh nghiệp phải có ít nhất 2 ký tự"),
  businessType: z.enum(["individual", "household", "company"]),
  taxCode: z.string().optional().nullable(),
  idCardNumber: z.string().min(9, "Số CCCD không hợp lệ").max(12),
  bankName: z.string().optional().nullable(),
  bankAccountNumber: z.string().optional().nullable(),
  bankAccountOwner: z.string().optional().nullable(),
});

const BUSINESS_TYPES = [
  { value: "individual", label: "Cá nhân" },
  { value: "household", label: "Hộ kinh doanh" },
  { value: "company", label: "Công ty" },
];

// ─── Status Banner ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: "Đang chờ duyệt",
    description: "Hồ sơ đang được ban quản trị xét duyệt. Vui lòng chờ.",
    className: "bg-amber-50 border-amber-200 text-amber-800",
    iconClass: "text-amber-600",
  },
  approved: {
    icon: CheckCircle2,
    label: "Đã được duyệt",
    description:
      "Doanh nghiệp của bạn đã được xác minh. Bạn có thể sử dụng đầy đủ tính năng.",
    className: "bg-emerald-50 border-emerald-200 text-emerald-800",
    iconClass: "text-emerald-600",
  },
  rejected: {
    icon: AlertCircle,
    label: "Bị từ chối",
    description: "Hồ sơ của bạn không hợp lệ hoặc thiếu thông tin.",
    className: "bg-red-50 border-red-200 text-red-800",
    iconClass: "text-red-600",
  },
  suspended: {
    icon: AlertCircle,
    label: "Tạm ngưng",
    description:
      "Tài khoản doanh nghiệp đang bị tạm ngưng. Vui lòng liên hệ ban quản trị.",
    className: "bg-slate-100 border-slate-300 text-slate-800",
    iconClass: "text-slate-600",
  },
};

const StatusBanner = ({ status, reason }) => {
  if (!status) return null;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
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
            <strong>Lý do từ chối:</strong> {reason}
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
      toast.success("Cập nhật hồ sơ thành công");
      reset(data);
      setDocumentFiles({
        idCardFront: [],
        idCardBack: [],
        businessLicense: [],
      });
      setIsEditing(false);
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể cập nhật hồ sơ");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    reset();
    setDocumentFiles({ idCardFront: [], idCardBack: [], businessLicense: [] });
    setIsEditing(false);
  };

  if (loading) return <ProfileSkeleton />;

  const businessTypeLabel = BUSINESS_TYPES.find(
    (t) => t.value === business?.businessType,
  )?.label;
  const basicInfoRows = useMemo(
    () => [
      { label: "Tên doanh nghiệp", value: business?.businessName },
      { label: "Loại hình", value: businessTypeLabel },
      { label: "Số CCCD/CMND", value: business?.idCardNumber },
      { label: "Mã số thuế", value: business?.taxCode },
    ],
    [
      business?.businessName,
      business?.idCardNumber,
      business?.taxCode,
      businessTypeLabel,
    ],
  );
  const bankInfoRows = useMemo(
    () => [
      { label: "Ngân hàng", value: business?.bankName },
      { label: "Số tài khoản", value: business?.bankAccountNumber },
      { label: "Chủ tài khoản", value: business?.bankAccountOwner },
    ],
    [
      business?.bankAccountNumber,
      business?.bankAccountOwner,
      business?.bankName,
    ],
  );
  const hasDocumentChanges = useMemo(
    () =>
      documentFiles.idCardFront.length > 0 ||
      documentFiles.idCardBack.length > 0 ||
      documentFiles.businessLicense.length > 0,
    [documentFiles],
  );

  const isSuspended = business?.status === BUSINESS_STATUS.SUSPENDED;
  const canSignContract =
    business?.status === BUSINESS_STATUS.APPROVED && !business?.contractSigned;

  const handleSignContract = async (payload) => {
    setSigning(true);
    try {
      await businessApi.contractSign(payload);
      await fetchProfile();
      toast.success("Đã ký hợp đồng thành công");
      setSignOpen(false);
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể ký hợp đồng");
      throw error;
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <PageHeader
        title="Hồ sơ doanh nghiệp"
        subtitle="Quản lý thông tin pháp lý và thanh toán"
        action={
          isSuspended ? null : !isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="gap-2">
              <Edit3 className="h-4 w-4" />
              Chỉnh sửa
            </Button>
          ) : (
            <Button variant="outline" onClick={handleCancel} className="gap-2">
              <X className="h-4 w-4" />
              Hủy
            </Button>
          )
        }
      />

      {/* Status Banner */}
      <StatusBanner
        status={business?.status}
        reason={business?.rejectionReason}
      />

      {!isEditing ? (
        /* View Mode */
        <div className="grid lg:grid-cols-2 gap-4">
          <SectionCard title="Thông tin cơ bản" titleIcon={Building2}>
            <div className="space-y-0">
              {basicInfoRows.map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-start justify-between py-2.5 border-b border-border/50 last:border-0"
                >
                  <span className="text-xs text-muted-foreground w-36 shrink-0">
                    {label}
                  </span>
                  <span className="text-sm font-medium text-foreground text-right">
                    {value || (
                      <span className="text-muted-foreground/50 italic text-xs">
                        Chưa cập nhật
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Thông tin ngân hàng" titleIcon={CreditCard}>
            <div className="space-y-0">
              {bankInfoRows.map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-start justify-between py-2.5 border-b border-border/50 last:border-0"
                >
                  <span className="text-xs text-muted-foreground w-36 shrink-0">
                    {label}
                  </span>
                  <span className="text-sm font-medium text-foreground text-right">
                    {value || (
                      <span className="text-muted-foreground/50 italic text-xs">
                        Chưa cập nhật
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Giấy tờ xác minh" titleIcon={CheckCircle2}>
            <div className="space-y-2.5">
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">
                  CCCD/CMND mặt trước
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {business?.idCardFront ? "Đã tải lên" : "Chưa tải lên"}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">
                  CCCD/CMND mặt sau
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {business?.idCardBack ? "Đã tải lên" : "Chưa tải lên"}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">
                  Giấy phép kinh doanh
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {business?.businessLicense ? "Đã tải lên" : "Chưa tải lên"}
                </p>
              </div>
            </div>
          </SectionCard>

          <div
            ref={contractSectionRef}
            id="business-contract-section"
            className="scroll-mt-24 lg:col-span-2"
          >
            <SectionCard title="Hợp đồng pháp lý" titleIcon={FileSignature}>
              <div className="space-y-3">
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">
                    Trạng thái hợp đồng
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {business?.contractSigned ? "Đã ký" : "Chưa ký"}
                  </p>
                  {business?.contractVersion && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Phiên bản: {business.contractVersion}
                    </p>
                  )}
                  {business?.contractSignedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Ký lúc:{" "}
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
                    ? "Đã hoàn tất ký hợp đồng"
                    : "Ký hợp đồng ngay"}
                </Button>
              </div>
            </SectionCard>
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Basic Info */}
            <SectionCard title="Thông tin cơ bản" titleIcon={Building2}>
              <div className="space-y-4">
                <FormField
                  label="Tên doanh nghiệp / Cửa hàng"
                  required
                  error={errors.businessName?.message}
                >
                  <Input
                    {...register("businessName")}
                    placeholder="VD: Cửa hàng Đi Đâu Giờ"
                  />
                </FormField>

                <FormField label="Loại hình kinh doanh">
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

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    label="Số CCCD/CMND"
                    required
                    error={errors.idCardNumber?.message}
                  >
                    <Input
                      {...register("idCardNumber")}
                      placeholder="Số CCCD"
                    />
                  </FormField>
                  <FormField label="Mã số thuế" error={errors.taxCode?.message}>
                    <Input {...register("taxCode")} placeholder="Mã số thuế" />
                  </FormField>
                </div>
              </div>
            </SectionCard>

            {/* Bank Info */}
            <SectionCard title="Thông tin ngân hàng" titleIcon={CreditCard}>
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>
                    Thông tin tài khoản sẽ được dùng để{" "}
                    <strong>chuyển doanh thu hàng tháng</strong>. Vui lòng nhập
                    chính xác.
                  </p>
                </div>

                <FormField label="Tên ngân hàng">
                  <Input
                    {...register("bankName")}
                    placeholder="VD: Vietcombank, TPBank..."
                  />
                </FormField>

                <FormField label="Số tài khoản">
                  <Input
                    {...register("bankAccountNumber")}
                    placeholder="Số tài khoản"
                  />
                </FormField>

                <FormField label="Chủ tài khoản (In hoa không dấu)">
                  <Input
                    {...register("bankAccountOwner")}
                    placeholder="VD: NGUYEN VAN A"
                  />
                </FormField>
              </div>
            </SectionCard>

            <SectionCard
              title="Cập nhật giấy tờ xác minh"
              titleIcon={CheckCircle2}
            >
              <div className="space-y-4">
                <FileUploader
                  label="CCCD/CMND mặt trước"
                  maxFiles={1}
                  value={documentFiles.idCardFront}
                  onChange={(files) =>
                    setDocumentFiles((prev) => ({
                      ...prev,
                      idCardFront: files,
                    }))
                  }
                  hint="Tùy chọn thay thế tệp hiện tại, tối đa 10MB"
                />

                <FileUploader
                  label="CCCD/CMND mặt sau"
                  maxFiles={1}
                  value={documentFiles.idCardBack}
                  onChange={(files) =>
                    setDocumentFiles((prev) => ({ ...prev, idCardBack: files }))
                  }
                  hint="Tùy chọn thay thế tệp hiện tại, tối đa 10MB"
                />

                <FileUploader
                  label="Giấy phép kinh doanh"
                  maxFiles={1}
                  value={documentFiles.businessLicense}
                  onChange={(files) =>
                    setDocumentFiles((prev) => ({
                      ...prev,
                      businessLicense: files,
                    }))
                  }
                  hint="Tùy chọn thay thế tệp hiện tại, tối đa 10MB"
                />
              </div>
            </SectionCard>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-6 z-50">
            <div
              className={cn(
                DESIGN.card,
                "p-3 flex items-center justify-between gap-3",
              )}
            >
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                {isDirty ? (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-amber-600">
                      Có thay đổi chưa được lưu
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-600">
                      Tất cả thông tin đã được lưu
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
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving || (!isDirty && !hasDocumentChanges)}
                  className="gap-2"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
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
