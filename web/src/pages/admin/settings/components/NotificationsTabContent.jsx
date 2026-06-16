import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui";
import SettingsSection from "@/components/settings/SettingsSection";
import { cn } from "@/lib/utils";

const NOTIFICATION_TOGGLES = [
  {
    section: "EMAIL",
    items: [
      { key: "emailNewBooking", label: "Đặt chỗ mới" },
      { key: "emailCancellation", label: "Hủy đặt chỗ" },
      { key: "emailNewReview", label: "Đánh giá mới" },
      { key: "emailPayout", label: "Rút tiền" },
    ],
  },
  {
    section: "PUSH",
    items: [
      { key: "pushEnabled", label: "Bật thông báo đẩy" },
      { key: "pushNewBooking", label: "Đặt chỗ mới" },
      { key: "pushNewReview", label: "Đánh giá mới" },
    ],
  },
  {
    section: "SMS",
    items: [
      { key: "smsEnabled", label: "Bật SMS" },
      { key: "smsNewBooking", label: "Đặt chỗ mới" },
    ],
  },
];

const NotificationsTabContent = ({ value, onChange }) => (
  <SettingsSection
    title="Cài đặt thông báo"
    description="Cấu hình email, push và SMS cho từng loại sự kiện"
  >
    {NOTIFICATION_TOGGLES.map((group) => (
      <div key={group.section} className="space-y-2">
        <Label className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {group.section}
        </Label>
        <div className="space-y-1">
          {group.items.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between border border-gray-200 px-4 py-3 hover:border-black transition-colors"
            >
              <span className="font-mono text-xs uppercase tracking-wide">
                {item.label}
              </span>
              <Switch
                checked={!!value[item.key]}
                onCheckedChange={(checked) => onChange(item.key, checked)}
              />
            </div>
          ))}
        </div>
      </div>
    ))}
  </SettingsSection>
);

export default NotificationsTabContent;
