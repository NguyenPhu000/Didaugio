import { Switch } from "@/components/ui/switch";
import SettingsSection from "@/components/settings/SettingsSection";

const NOTIFICATION_SECTIONS = [
  {
    key: "booking",
    title: "Thông báo Đơn đặt chỗ & Hủy hẹn",
    description: "Cập nhật kịp thời tình trạng phục vụ du khách trên hệ thống.",
    items: [
      {
        key: "newBookingEmail",
        label: "Email khi có đơn đặt chỗ mới",
        description: "Gửi chi tiết thông tin khách, ngày giờ và dịch vụ đến hòm thư đối tác.",
      },
      {
        key: "newBookingPush",
        label: "Thông báo đẩy khi có đơn đặt chỗ mới",
        description: "Bật popup thông báo tức thời trên trình duyệt khi có khách đặt thành công.",
      },
      {
        key: "cancellationEmail",
        label: "Email khi du khách hủy đặt chỗ",
        description: "Nhận thông báo giải phóng chỗ và lý do hủy lịch của khách.",
      },
      {
        key: "cancellationPush",
        label: "Thông báo đẩy khi du khách hủy đặt chỗ",
        description: "Bật cảnh báo nhanh để nhân viên kịp thời cập nhật bàn / phòng trống.",
      },
    ],
  },
  {
    key: "reviewAndFinance",
    title: "Thông báo Đánh giá & Rút tiền quyết toán",
    description: "Theo dõi phản hồi chất lượng dịch vụ và biến động số dư ví.",
    items: [
      {
        key: "newReviewEmail",
        label: "Email khi có đánh giá mới từ khách",
        description: "Nhắc nhở phản hồi đánh giá để nâng cao uy tín cho quán.",
      },
      {
        key: "newReviewPush",
        label: "Thông báo đẩy khi nhận đánh giá mới",
        description: "Hiển thị thông báo ngay khi du khách chấm sao và gửi nhận xét.",
      },
      {
        key: "payoutEmail",
        label: "Email xác nhận rút tiền thành công",
        description: "Nhận thông báo khi lệnh quyết toán doanh thu được chuyển về ngân hàng.",
      },
    ],
  },
];

const BusinessNotificationsTab = ({ value = {}, onChange }) => (
  <div className="flex flex-col justify-between h-full space-y-8">
    <div className="space-y-8">
      {NOTIFICATION_SECTIONS.map((sec) => (
        <SettingsSection
          key={sec.key}
          title={sec.title}
          description={sec.description}
        >
          <div className="grid grid-cols-1 gap-3">
            {sec.items.map((item) => {
              const isEnabled = value[item.key] !== false;
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-[#F9F9FB] hover:bg-[#F2F2F7]/80 p-4 border border-black/[0.02] transition-colors"
                >
                  <div className="space-y-0.5 pr-4">
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="text-xs leading-relaxed text-slate-500 font-normal">
                      {item.description}
                    </p>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => onChange(item.key, checked)}
                  />
                </div>
              );
            })}
          </div>
        </SettingsSection>
      ))}
    </div>

    <div className="pt-4 flex items-center justify-between text-xs text-slate-400">
      <span>Được tối ưu để tránh làm phiền ngoài giờ phục vụ</span>
      <span>Kênh thông báo vận hành doanh nghiệp</span>
    </div>
  </div>
);

export default BusinessNotificationsTab;
