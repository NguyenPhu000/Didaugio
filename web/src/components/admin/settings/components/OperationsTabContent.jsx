import { Switch } from "@/components/ui/switch";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingSelectField from "./SettingSelectField";

const COMMISSION_OPTIONS = [
  { value: "5", label: "5% (Ưu đãi đặc biệt)" },
  { value: "8", label: "8% (Đối tác chiến lược)" },
  { value: "10", label: "10% (Tiêu chuẩn nền tảng)" },
  { value: "12", label: "12% (Dịch vụ cao cấp)" },
  { value: "15", label: "15% (Dịch vụ đặc thù)" },
  { value: "20", label: "20% (Tour trọn gói)" },
];

const TIMEOUT_OPTIONS = [
  { value: "10", label: "10 phút (Giữ chỗ nhanh)" },
  { value: "15", label: "15 phút (Khuyến nghị VietQR)" },
  { value: "30", label: "30 phút (Mùa cao điểm)" },
  { value: "60", label: "60 phút (Tour dài ngày)" },
];

const PAYOUT_OPTIONS = [
  { value: "100000", label: "100.000 ₫" },
  { value: "200000", label: "200.000 ₫ (Tiêu chuẩn)" },
  { value: "500000", label: "500.000 ₫" },
  { value: "1000000", label: "1.000.000 ₫" },
];

const OperationsTabContent = ({ value = {}, onChange }) => (
  <div className="flex flex-col justify-between h-full space-y-8">
    <div className="space-y-8">
      <SettingsSection
        title="Chính sách hoa hồng & Thanh toán đơn đặt chỗ"
        description="Áp dụng cho luồng thanh toán SePay VietQR và hạch toán vào ví đối tác trong hệ thống."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#F9F9FB] p-4 border border-black/[0.02]">
            <SettingSelectField
              id="op-commission-rate"
              label="Tỷ lệ hoa hồng nền tảng mặc định"
              value={value.defaultCommissionRate ?? 10}
              onChange={(v) => onChange("defaultCommissionRate", Number(v))}
              options={COMMISSION_OPTIONS}
            />
            <p className="mt-2 text-[11px] text-slate-400">
              Trích trực tiếp từ giá trị đơn đặt chỗ vào ví nền tảng khi thanh toán thành công.
            </p>
          </div>

          <div className="rounded-2xl bg-[#F9F9FB] p-4 border border-black/[0.02]">
            <SettingSelectField
              id="op-payment-timeout"
              label="Thời gian chờ thanh toán VietQR"
              value={value.paymentTimeoutMinutes ?? 15}
              onChange={(v) => onChange("paymentTimeoutMinutes", Number(v))}
              options={TIMEOUT_OPTIONS}
            />
            <p className="mt-2 text-[11px] text-slate-400">
              Đơn hàng chưa thanh toán quá thời gian này sẽ tự động hủy để giải phóng chỗ.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#F9F9FB] p-4 border border-black/[0.02]">
          <SettingSelectField
            id="op-min-payout"
            label="Ngưỡng rút tiền tối thiểu cho đối tác kinh doanh"
            value={value.minPayoutAmount ?? 200000}
            onChange={(v) => onChange("minPayoutAmount", Number(v))}
            options={PAYOUT_OPTIONS}
          />
          <p className="mt-2 text-[11px] text-slate-400">
            Số dư ví khả dụng tối thiểu để đối tác có thể tạo lệnh rút tiền về tài khoản ngân hàng.
          </p>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Quy trình kiểm duyệt nội dung"
        description="Kiểm soát điều kiện công khai địa điểm và đánh giá của du khách trên hệ thống."
      >
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#F9F9FB] hover:bg-[#F2F2F7]/80 p-4 border border-black/[0.02] transition-colors">
            <div className="space-y-0.5 pr-4">
              <p className="text-sm font-semibold text-slate-900">
                Tự động duyệt địa điểm mới
              </p>
              <p className="text-xs leading-relaxed text-slate-500 font-normal">
                Bật để địa điểm của đối tác được xuất bản ngay; tắt để chuyển vào hàng đợi kiểm duyệt thủ công.
              </p>
            </div>
            <Switch
              checked={!!value.autoApprovePlaces}
              onCheckedChange={(checked) => onChange("autoApprovePlaces", checked)}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#F9F9FB] hover:bg-[#F2F2F7]/80 p-4 border border-black/[0.02] transition-colors">
            <div className="space-y-0.5 pr-4">
              <p className="text-sm font-semibold text-slate-900">
                Tự động duyệt đánh giá của du khách
              </p>
              <p className="text-xs leading-relaxed text-slate-500 font-normal">
                Đánh giá và phản hồi của du khách được hiển thị ngay lập tức sau khi gửi.
              </p>
            </div>
            <Switch
              checked={value.autoApproveReviews !== false}
              onCheckedChange={(checked) => onChange("autoApproveReviews", checked)}
            />
          </div>
        </div>
      </SettingsSection>
    </div>

    <div className="pt-4 flex items-center justify-between text-xs text-slate-400">
      <span>Đồng bộ tức thời với nghiệp vụ ví đối tác và hợp đồng</span>
      <span>Nghiệp vụ Đặt chỗ & Đối tác Cần Thơ</span>
    </div>
  </div>
);

export default OperationsTabContent;
