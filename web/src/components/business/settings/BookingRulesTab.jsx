import { Label } from "@/components/ui";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SettingsSection from "@/components/settings/SettingsSection";

const NO_SHOW_OPTIONS = [
  { value: "none", label: "Không tính phí phạt" },
  { value: "charge_25", label: "Khấu trừ 25% giá trị đặt chỗ" },
  { value: "charge_50", label: "Khấu trừ 50% giá trị đặt chỗ (Tiêu chuẩn)" },
  { value: "charge_100", label: "Khấu trừ 100% (Không hoàn tiền)" },
];

const MAX_ADVANCE_OPTIONS = [
  { value: "7", label: "7 ngày tới" },
  { value: "14", label: "14 ngày tới" },
  { value: "30", label: "30 ngày tới (Khuyến nghị)" },
  { value: "60", label: "60 ngày tới" },
  { value: "90", label: "90 ngày (Theo quý)" },
  { value: "180", label: "180 ngày (Nửa năm)" },
];

const MIN_LEAD_OPTIONS = [
  { value: "0", label: "Nhận khách tức thời (0 phút)" },
  { value: "15", label: "Trước ít nhất 15 phút" },
  { value: "30", label: "Trước ít nhất 30 phút" },
  { value: "60", label: "Trước ít nhất 1 giờ (Khuyến nghị)" },
  { value: "120", label: "Trước ít nhất 2 giờ" },
  { value: "240", label: "Trước ít nhất 4 giờ" },
];

const CANCELLATION_OPTIONS = [
  { value: "0", label: "Cho phép hủy sát giờ phục vụ" },
  { value: "4", label: "Trước ít nhất 4 giờ" },
  { value: "12", label: "Trước ít nhất 12 giờ" },
  { value: "24", label: "Trước ít nhất 24 giờ (1 ngày - Tiêu chuẩn)" },
  { value: "48", label: "Trước ít nhất 48 giờ (2 ngày)" },
  { value: "72", label: "Trước ít nhất 72 giờ (3 ngày)" },
];

const BookingRulesTab = ({ value = {}, onChange }) => (
  <div className="flex flex-col justify-between h-full space-y-8">
    <div className="space-y-8">
      <SettingsSection
        title="Cơ chế xử lý đơn đặt chỗ tự động"
        description="Kiểm soát luồng tiếp nhận và duyệt đơn từ du khách khi thanh toán thành công."
      >
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#F9F9FB] hover:bg-[#F2F2F7]/80 p-4 border border-black/[0.02] transition-colors">
            <div className="space-y-0.5 pr-4">
              <p className="text-sm font-semibold text-slate-900">
                Tự động xác nhận đơn đặt chỗ (Auto-approve)
              </p>
              <p className="text-xs leading-relaxed text-slate-500 font-normal">
                Tự động xác nhận giữ chỗ ngay khi du khách hoàn tất chuyển khoản VietQR SePay mà không cần duyệt thủ công.
              </p>
            </div>
            <Switch
              checked={!!value.autoApprove}
              onCheckedChange={(checked) => onChange("autoApprove", checked)}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#F9F9FB] hover:bg-[#F2F2F7]/80 p-4 border border-black/[0.02] transition-colors">
            <div className="space-y-0.5 pr-4">
              <p className="text-sm font-semibold text-slate-900">
                Cho phép đặt vượt công suất (Overbooking)
              </p>
              <p className="text-xs leading-relaxed text-slate-500 font-normal">
                Tiếp nhận thêm lượt đặt chỗ khi quán đã đạt số lượng khách tối đa trong khung giờ cao điểm.
              </p>
            </div>
            <Switch
              checked={!!value.allowOverbooking}
              onCheckedChange={(checked) => onChange("allowOverbooking", checked)}
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Khung thời gian tiếp nhận & Hủy đặt chỗ"
        description="Quy định thời gian du khách được phép đặt trước và chính sách hoàn tiền khi hủy hẹn."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#F9F9FB] p-4 border border-black/[0.02] space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Thời gian du khách được đặt trước tối đa
            </Label>
            <Select
              value={String(value.maxAdvanceDays ?? 30)}
              onValueChange={(next) => onChange("maxAdvanceDays", Number(next))}
            >
              <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 hover:border-slate-300 transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-slate-200 shadow-lg">
                {MAX_ADVANCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-sm">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-slate-400">Giới hạn thời gian mở lịch trên ứng dụng.</p>
          </div>

          <div className="rounded-2xl bg-[#F9F9FB] p-4 border border-black/[0.02] space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Thời gian thông báo trước tối thiểu
            </Label>
            <Select
              value={String(value.minLeadMinutes ?? 0)}
              onValueChange={(next) => onChange("minLeadMinutes", Number(next))}
            >
              <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 hover:border-slate-300 transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-slate-200 shadow-lg">
                {MIN_LEAD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-sm">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-slate-400">Thời gian quán cần chuẩn bị trước khi đón khách.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#F9F9FB] p-4 border border-black/[0.02] space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Thời hạn hủy đặt chỗ miễn phí
            </Label>
            <Select
              value={String(value.cancellationWindowHours ?? 24)}
              onValueChange={(next) => onChange("cancellationWindowHours", Number(next))}
            >
              <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 hover:border-slate-300 transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-slate-200 shadow-lg">
                {CANCELLATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-sm">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-slate-400">Khách hủy trước mốc này sẽ được hoàn 100% tiền cọc.</p>
          </div>

          <div className="rounded-2xl bg-[#F9F9FB] p-4 border border-black/[0.02] space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Chính sách khi khách không đến (No-show)
            </Label>
            <Select
              value={value.noShowPolicy || "charge_50"}
              onValueChange={(v) => onChange("noShowPolicy", v)}
            >
              <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 hover:border-slate-300 transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-slate-200 shadow-lg">
                {NO_SHOW_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-sm">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-slate-400">Quy định xử lý khoản tiền thanh toán khi khách bỏ hẹn.</p>
          </div>
        </div>
      </SettingsSection>
    </div>

    <div className="pt-4 flex items-center justify-between text-xs text-slate-400">
      <span>Được áp dụng tự động cho toàn bộ dịch vụ và điểm bán của doanh nghiệp</span>
      <span>Chính sách tiếp nhận khách du lịch</span>
    </div>
  </div>
);

export default BookingRulesTab;
