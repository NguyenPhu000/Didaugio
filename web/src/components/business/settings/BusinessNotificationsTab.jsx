import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui";
import SettingsSection from "@/components/settings/SettingsSection";

const BusinessNotificationsTab = ({ value, onChange }) => {
  const { t } = useTranslation();

  const notificationGroups = [
    {
      section: t("business.settings.notifications.bookingSection"),
      items: [
        { key: "newBookingEmail", label: t("business.settings.notifications.newBookingEmail") },
        { key: "newBookingPush", label: t("business.settings.notifications.newBookingPush") },
        { key: "cancellationEmail", label: t("business.settings.notifications.cancellationEmail") },
        { key: "cancellationPush", label: t("business.settings.notifications.cancellationPush") },
      ],
    },
    {
      section: t("business.settings.notifications.reviewSection"),
      items: [
        { key: "newReviewEmail", label: t("business.settings.notifications.newReviewEmail") },
        { key: "newReviewPush", label: t("business.settings.notifications.newReviewPush") },
        { key: "payoutEmail", label: t("business.settings.notifications.payoutEmail") },
      ],
    },
  ];

  return (
    <SettingsSection
      title={t("business.settings.notifications.title")}
      description={t("business.settings.notifications.description")}
    >
      {notificationGroups.map((group) => (
        <div key={group.section} className="space-y-2">
          <Label className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {group.section}
          </Label>
          <div className="space-y-1">
            {group.items.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 border border-gray-200 px-3 sm:px-4 py-3 hover:border-black transition-colors"
              >
                <span className="font-mono text-xs uppercase tracking-wide leading-relaxed">
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
};

export default BusinessNotificationsTab;
