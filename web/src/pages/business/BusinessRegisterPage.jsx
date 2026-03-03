import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Store, ArrowRight } from "lucide-react";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import useBusinessStore from "@/stores/businessStore";
import { BUSINESS_ROUTES } from "@/constants/routes";

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

const BusinessRegisterPage = () => {
  const navigate = useNavigate();
  const { registerBusiness } = useBusinessStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Store className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Đăng ký doanh nghiệp</h1>
      </div>
      <p className="text-gray-600">
        Điền thông tin doanh nghiệp để bắt đầu đăng địa điểm trên Đi Đâu Giờ.
      </p>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên doanh nghiệp *</label>
              <Input {...register("businessName")} placeholder="Tên doanh nghiệp / cửa hàng" />
              {errors.businessName && (
                <p className="text-sm text-red-500">{errors.businessName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Loại hình *</label>
              <select
                {...register("businessType")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Số CCCD *</label>
              <Input {...register("idCardNumber")} placeholder="Số CCCD/CMND" />
              {errors.idCardNumber && (
                <p className="text-sm text-red-500">{errors.idCardNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mã số thuế</label>
              <Input {...register("taxCode")} placeholder="Nếu có" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên ngân hàng</label>
                <Input {...register("bankName")} placeholder="VD: Vietcombank" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Số tài khoản</label>
                <Input {...register("bankAccountNumber")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Chủ tài khoản</label>
                <Input {...register("bankAccountOwner")} />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Đang gửi..." : (
                <>Đăng ký <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessRegisterPage;
