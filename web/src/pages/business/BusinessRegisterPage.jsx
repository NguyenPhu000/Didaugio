import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
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
import useBusinessStore from "@/stores/businessStore";
import { BUSINESS_ROUTES } from "@/constants/routes";
import {
  PageHeader,
  SectionCard,
} from "@/components/business/DashboardWidgets";

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
  const navigate = useNavigate();
  const { registerBusiness } = useBusinessStore();
  const [isLoading, setIsLoading] = useState(false);

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

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await registerBusiness(data);
      toast.success("Đăng ký thành công! Hồ sơ đang chờ duyệt.");
      navigate(BUSINESS_ROUTES.PROFILE);
    } catch (error) {
      toast.error(error.message || "Không thể đăng ký");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 min-h-screen">
      <PageHeader
        title="Đăng ký doanh nghiệp"
        subtitle="Điền thông tin để bắt đầu đăng địa điểm trên Đi Đâu Giờ"
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
