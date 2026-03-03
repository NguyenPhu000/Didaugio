import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Store, Save, Upload } from "lucide-react";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import useBusinessStore from "@/stores/businessStore";

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

const BusinessProfilePage = () => {
  const { business, loading, updateProfile } = useBusinessStore();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
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

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await updateProfile(data);
      toast.success("Cập nhật hồ sơ thành công");
    } catch (error) {
      toast.error(error.message || "Không thể cập nhật hồ sơ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  const statusBadge = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Store className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Hồ sơ doanh nghiệp</h1>
        </div>
        {business?.status && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge[business.status]}`}>
            {business.status === "pending" && "Đang chờ duyệt"}
            {business.status === "approved" && "Đã duyệt"}
            {business.status === "rejected" && "Bị từ chối"}
          </span>
        )}
      </div>

      {business?.status === "rejected" && business?.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Lý do từ chối:</p>
          <p className="text-red-700">{business.rejectionReason}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên doanh nghiệp *</label>
                <Input {...register("businessName")} placeholder="Tên doanh nghiệp" />
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
                <label className="text-sm font-medium">Mã số thuế</label>
                <Input {...register("taxCode")} placeholder="Mã số thuế" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Số CCCD *</label>
                <Input {...register("idCardNumber")} placeholder="Số CCCD/CMND" />
                {errors.idCardNumber && (
                  <p className="text-sm text-red-500">{errors.idCardNumber.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin ngân hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên ngân hàng</label>
                <Input {...register("bankName")} placeholder="VD: Vietcombank" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Số tài khoản</label>
                <Input {...register("bankAccountNumber")} placeholder="Số tài khoản" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Chủ tài khoản</label>
                <Input {...register("bankAccountOwner")} placeholder="Tên chủ tài khoản" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BusinessProfilePage;
