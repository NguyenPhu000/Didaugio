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
  PageHeader,
  SectionCard,
} from "@/components/business/DashboardWidgets";
import DocumentImageUploadField from "@/components/business/DocumentImageUploadField";
import { DOCUMENT_SAMPLE_IMAGES } from "@/components/business/documentImageConstants";

const registerSchema = z.object({
  businessName: z.string().min(2, "Tên doanh nghiệp phải có ít nhất 2 ký tự"),
  businessType: z.enum(["individual", "household", "company"]),
  taxCode: z.string().optional(),
  idCardNumber: z.string().min(9, "Số CCCD không hợp lệ").max(12),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountOwner: z.string().optional(),
});

const BUSINESS_TYPES = [
  { value: "individual", label: "Cá nhân" },
  { value: "household", label: "Hộ kinh doanh" },
  { value: "company", label: "Công ty" },
];

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
          ? "Vui lòng tải ảnh Giấy phép kinh doanh / Chứng nhận"
          : "",
      idCardFront:
        documents.idCardFront.length === 0
          ? "Vui lòng tải CCCD/CMND mặt trước"
          : "",
      idCardBack:
        documents.idCardBack.length === 0
          ? "Vui lòng tải CCCD/CMND mặt sau"
          : "",
    };

    setDocumentErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      toast.error("Bạn cần tải đầy đủ 3 giấy tờ bắt buộc");
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
    <div className="space-y-6 p-6 lg:p-8 min-h-screen">
      <PageHeader
        title={t("business.register.title")}
        subtitle={t("business.register.title")}
      />

      <SectionCard title="Thông tin đăng ký" titleIcon={Store}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("businessType")} />

          <FormField
            label="Tên doanh nghiệp"
            required
            error={errors.businessName?.message}
          >
            <Input
              {...register("businessName")}
              placeholder="Tên doanh nghiệp / cửa hàng"
            />
          </FormField>

          <FormField label="Loại hình" required>
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
              label="Số CCCD"
              required
              error={errors.idCardNumber?.message}
            >
              <Input {...register("idCardNumber")} placeholder="Số CCCD/CMND" />
            </FormField>
            <FormField label="Mã số thuế" error={errors.taxCode?.message}>
              <Input {...register("taxCode")} placeholder="Nếu có" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Tên ngân hàng">
              <Input {...register("bankName")} placeholder="VD: Vietcombank" />
            </FormField>
            <FormField label="Số tài khoản">
              <Input {...register("bankAccountNumber")} />
            </FormField>
            <FormField label="Chủ tài khoản">
              <Input {...register("bankAccountOwner")} />
            </FormField>
          </div>

          <SectionCard title="Giấy tờ xác minh" bodyClassName="space-y-4">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <h4 className="text-sm font-semibold text-foreground">
                Upload hình ảnh giấy tờ
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Ảnh mẫu sẽ hiển thị mặc định. Khi chọn ảnh mới, preview sẽ đổi
                ngay theo ảnh bạn tải lên.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
                <DocumentImageUploadField
                  label="Giấy phép kinh doanh / Chứng nhận"
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
                  hint="Tải lên hình chụp Giấy phép kinh doanh hoặc giấy chứng nhận liên quan"
                  fallbackPreview={DOCUMENT_SAMPLE_IMAGES.portrait}
                  previewAlt="Giấy phép kinh doanh"
                  previewClassName="h-[300px] sm:h-[360px]"
                  error={documentErrors.businessLicense}
                  disabled={isLoading}
                />

                <DocumentImageUploadField
                  label="Ảnh mặt trước CC/CCCD"
                  required
                  value={documents.idCardFront}
                  onChange={(files) => {
                    setDocuments((prev) => ({ ...prev, idCardFront: files }));
                    setDocumentErrors((prev) => ({ ...prev, idCardFront: "" }));
                  }}
                  hint="Tải lên ảnh mặt trước CC/CCCD có định dạng PNG, JPEG, JPG"
                  fallbackPreview={DOCUMENT_SAMPLE_IMAGES.idCardFront}
                  previewAlt="CCCD mặt trước"
                  previewClassName="h-[220px] sm:h-[260px]"
                  error={documentErrors.idCardFront}
                  disabled={isLoading}
                />

                <DocumentImageUploadField
                  label="Ảnh mặt sau CC/CCCD"
                  required
                  value={documents.idCardBack}
                  onChange={(files) => {
                    setDocuments((prev) => ({ ...prev, idCardBack: files }));
                    setDocumentErrors((prev) => ({ ...prev, idCardBack: "" }));
                  }}
                  hint="Tải lên ảnh mặt sau CC/CCCD có định dạng PNG, JPEG, JPG"
                  fallbackPreview={DOCUMENT_SAMPLE_IMAGES.idCardBack}
                  previewAlt="CCCD mặt sau"
                  previewClassName="h-[220px] sm:h-[260px]"
                  error={documentErrors.idCardBack}
                  disabled={isLoading}
                />
              </div>
            </div>
          </SectionCard>

          <Button type="submit" disabled={isLoading} className="w-full gap-2">
            {isLoading ? "Đang gửi..." : "Đăng ký"}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>
      </SectionCard>
    </div>
  );
};

export default BusinessRegisterPage;
