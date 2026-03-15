import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  Save,
  CreditCard,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
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

const SectionPanel = ({ title, icon: Icon, children, className = "" }) => (
  <section className={`border-2 border-black bg-white ${className}`}>
    <div className="flex items-center gap-3 px-6 py-4 border-b border-black bg-[#f8f8f8]">
      {Icon && (
        <div className="p-1.5 bg-white border border-black">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <h2 className="text-lg md:text-xl uppercase tracking-widest font-black">
        {title}
      </h2>
    </div>
    <div className="p-6 md:p-7">{children}</div>
  </section>
);

const InputField = ({ label, error, required, className = "", ...props }) => (
  <div className={`space-y-2 ${className}`}>
    <label className="font-mono text-[11px] md:text-xs font-bold uppercase tracking-widest text-gray-700 flex justify-between items-center gap-2">
      <span>
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      {error && (
        <span className="text-red-700 bg-red-50 px-2 py-0.5 border border-red-300 text-[10px]">
          {error}
        </span>
      )}
    </label>
    <input
      className={`w-full border-2 border-black p-3 font-mono text-sm md:text-base focus:outline-none ${error ? "bg-red-50" : "bg-white"} focus:bg-[#fffef6] transition-colors ${props.className || ""}`}
      {...props}
    />
  </div>
);

const SelectField = ({ label, children, ...props }) => (
  <div className="space-y-2">
    <label className="font-mono text-[11px] md:text-xs font-bold uppercase tracking-widest text-gray-700">
      {label}
    </label>
    <select
      className="w-full border-2 border-black p-3 font-mono text-sm md:text-base focus:outline-none bg-white focus:bg-[#fffef6] transition-colors cursor-pointer"
      {...props}
    >
      {children}
    </select>
  </div>
);

const BrutalistButton = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => {
  const variants = {
    primary: "bg-black text-white hover:bg-[#1e1e1e]",
    secondary: "bg-white text-black hover:bg-gray-100",
  };
  return (
    <button
      className={`font-mono uppercase font-bold tracking-widest text-sm px-6 py-3 border-2 border-black transition-colors ${variants[variant]} ${props.disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      {...props}
    >
      <div className="flex items-center justify-center gap-3">{children}</div>
    </button>
  );
};

const StatusBanner = ({ status, reason }) => {
  if (!status) return null;

  const statusConfig = {
    pending: {
      color: "bg-[#f5f4e8]",
      textCol: "text-[#5f5531]",
      icon: Clock,
      label: "ĐANG CHỜ DUYỆT",
      text: "Hồ sơ của bạn đang được ban quản trị xét duyệt. Vui lòng chờ.",
    },
    approved: {
      color: "bg-[#eaf5ef]",
      textCol: "text-[#205c3b]",
      icon: CheckCircle2,
      label: "ĐÃ ĐƯỢC DUYỆT",
      text: "Doanh nghiệp của bạn hợp lệ. Hiện bạn có thể sử dụng tất cả các tính năng.",
    },
    rejected: {
      color: "bg-[#f9ecec]",
      textCol: "text-[#7d2d2d]",
      icon: AlertCircle,
      label: "BỊ TỪ CHỐI",
      text: "Hồ sơ của bạn không hợp lệ hoặc thiếu thông tin.",
    },
  };

  const cfg = statusConfig[status] || statusConfig.pending;
  const StatusIcon = cfg.icon;

  return (
    <div
      className={`border-2 border-black p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4 ${cfg.color} ${cfg.textCol || "text-black"}`}
    >
      <div className="bg-white p-2 border border-black text-black">
        <StatusIcon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <h3 className="font-black uppercase tracking-widest text-base md:text-lg mb-1">
          TRẠNG THÁI: {cfg.label}
        </h3>
        <p className="font-mono text-sm font-semibold">{cfg.text}</p>
        {status === "rejected" && reason && (
          <div className="mt-4 p-3 bg-white text-[#7d2d2d] border border-[#d8a3a3] font-mono">
            <p className="uppercase tracking-widest mb-1 text-xs font-bold">
              LÝ DO TỪ CHỐI:
            </p>
            <p>{reason}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const BusinessProfilePage = () => {
  const { business, loading, updateProfile } = useBusinessStore();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
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

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await updateProfile(data);
      toast.success("CẬP NHẬT HỒ SƠ THÀNH CÔNG");
      reset(data);
    } catch (error) {
      toast.error(error.message || "KHÔNG THỂ CẬP NHẬT HỒ SƠ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-8 border-black border-t-yellow-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-end justify-between border-b border-black pb-6">
        <div className="flex items-center gap-6">
          <div className="w-1.5 h-14 bg-yellow-400 hidden md:block" />
          <div>
            <h1 className="text-3xl md:text-5xl uppercase font-black tracking-tight">
              HỒ SƠ DOANH NGHIỆP
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="bg-black text-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest">
                BUSINESS // PROFILE
              </span>
              <p className="font-mono text-[11px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">
                QUẢN LÝ THÔNG TIN PHÁP LÝ VÀ THANH TOÁN
              </p>
            </div>
          </div>
        </div>
      </div>

      <StatusBanner
        status={business?.status}
        reason={business?.rejectionReason}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid lg:grid-cols-2 gap-6">
          <SectionPanel
            title="Thông tin cơ bản"
            icon={Building2}
            className="bg-[#fdfdfd]"
          >
            <div className="space-y-6">
              <InputField
                label="Tên doanh nghiệp / Cửa hàng"
                required
                {...register("businessName")}
                placeholder="VD: Cửa hàng Di Đâu Giờ"
                error={errors.businessName?.message}
              />

              <SelectField
                label="Loại hình kinh doanh"
                {...register("businessType")}
              >
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </SelectField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#fafafa] border border-black border-dashed">
                <InputField
                  label="Số CCCD/CMND"
                  required
                  {...register("idCardNumber")}
                  placeholder="Số CCCD"
                  error={errors.idCardNumber?.message}
                />
                <InputField
                  label="Mã số thuế"
                  {...register("taxCode")}
                  placeholder="Mã số thuế"
                />
              </div>
            </div>
          </SectionPanel>

          <SectionPanel
            title="Thông tin ngân hàng"
            icon={CreditCard}
            className="bg-[#fcfcef]"
          >
            <div className="space-y-6">
              <div className="bg-white p-4 border border-black mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#2a8f65] flex-shrink-0 mt-0.5" />
                <p className="font-mono font-bold text-xs md:text-sm leading-relaxed text-[#2f2f2f]">
                  Thông tin tài khoản ngân hàng sẽ được dùng để{" "}
                  <span className="text-[#205c3b] bg-[#eaf5ef] px-1 py-0.5">
                    chuyển doanh thu hàng tháng
                  </span>{" "}
                  cho doanh nghiệp. Vui lòng nhập chính xác.
                </p>
              </div>

              <InputField
                label="Tên Ngân hàng"
                {...register("bankName")}
                placeholder="VD: Vietcombank, TPBank..."
              />

              <InputField
                label="Số tài khoản"
                {...register("bankAccountNumber")}
                placeholder="Số tài khoản"
              />

              <InputField
                label="Chủ tài khoản (In hoa không dấu)"
                {...register("bankAccountOwner")}
                placeholder="VD: NGUYEN VAN A"
              />
            </div>
          </SectionPanel>
        </div>

        <div className="sticky bottom-6 z-50 bg-white border-2 border-black p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-mono font-bold text-xs md:text-sm text-gray-600 w-full md:w-auto text-center md:text-left">
            {isDirty ? (
              <span className="text-[#8a6c16] flex items-center justify-center md:justify-start gap-2 uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" /> ĐÃ CÓ THAY ĐỔI CHƯA LƯU
              </span>
            ) : (
              <span className="flex items-center justify-center md:justify-start gap-2 text-[#2a8f65] uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" /> TẤT CẢ THÔNG TIN ĐÃ ĐƯỢC
                LƯU
              </span>
            )}
          </div>
          <BrutalistButton
            type="submit"
            disabled={saving || !isDirty}
            className="w-full md:w-auto"
          >
            <Save className="h-5 w-5" />
            {saving ? "ĐANG LƯU..." : "LƯU THAY ĐỔI HỒ SƠ"}
          </BrutalistButton>
        </div>
      </form>
    </div>
  );
};

export default BusinessProfilePage;
