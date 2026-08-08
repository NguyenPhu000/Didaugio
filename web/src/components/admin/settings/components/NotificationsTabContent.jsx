import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import SettingsSection from "@/components/settings/SettingsSection";
import { cn } from "@/lib/utils";

const NOTIFICATION_GROUPS = [
  {
    key: "email",
    label: "EMAIL",
    items: [
      ["emailNewBooking", "Đặt chỗ mới", "Gửi email khi hệ thống nhận đặt chỗ."],
      ["emailCancellation", "Hủy đặt chỗ", "Thông báo khi khách hoặc nhân viên hủy đặt chỗ."],
      ["emailNewReview", "Đánh giá mới", "Nhắc quản trị viên khi có phản hồi mới."],
      ["emailPayout", "Rút tiền", "Cập nhật các yêu cầu và trạng thái rút tiền."],
    ],
  },
  {
    key: "push",
    label: "PUSH",
    items: [
      ["pushEnabled", "Bật thông báo đẩy", "Bật kênh thông báo nhanh trên thiết bị."],
      ["pushNewBooking", "Đặt chỗ mới", "Hiển thị thông báo ngay khi có đặt chỗ."],
      ["pushNewReview", "Đánh giá mới", "Hiển thị phản hồi mới trong trung tâm thông báo."],
    ],
  },
  {
    key: "sms",
    label: "SMS",
    items: [
      ["smsEnabled", "Bật SMS", "Dùng SMS cho các sự kiện cần phản hồi nhanh."],
      ["smsNewBooking", "Đặt chỗ mới", "Gửi SMS khi có đặt chỗ mới."],
    ],
  },
];

const NotificationsTabContent = ({ value, onChange }) => {
  const { t } = useTranslation();

  return (
    <SettingsSection
      title={t("settings.adminNotifications.title", {
        defaultValue: "Cài đặt thông báo",
      })}
      description={t("settings.adminNotifications.description", {
        defaultValue: "Chọn kênh nhận thông báo cho từng loại sự kiện.",
      })}
    >
      <div className="space-y-6">
        {NOTIFICATION_GROUPS.map((group) => (
          <div key={group.key} className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
              {group.label}
            </p>
            <div className="space-y-2">
              {group.items.map(([key, label, description]) => {
                const enabled = !!value[key];
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors",
                      enabled
                        ? "border-emerald-200 bg-emerald-50/70"
                        : "border-zinc-200 bg-white hover:border-zinc-400"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900">{label}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                        {description}
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => onChange(key, checked)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
};

export default NotificationsTabContent;
