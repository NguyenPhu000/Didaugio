import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { BusinessSectionCard } from "@/components/business/ui/BusinessSectionCard";

const BusinessNotificationsTab = ({ value, onChange }) => {
  const { t } = useTranslation();

  const notificationGroups = [
    {
      section: t("business.settings.notifications.bookingSection"),
      items: [
        {
          key: "newBookingEmail",
          label: t("business.settings.notifications.newBookingEmail"),
          description: t("business.settings.notifications.newBookingEmailDescription"),
        },
        {
          key: "newBookingPush",
          label: t("business.settings.notifications.newBookingPush"),
          description: t("business.settings.notifications.newBookingPushDescription"),
        },
        {
          key: "cancellationEmail",
          label: t("business.settings.notifications.cancellationEmail"),
          description: t("business.settings.notifications.cancellationEmailDescription"),
        },
        {
          key: "cancellationPush",
          label: t("business.settings.notifications.cancellationPush"),
          description: t("business.settings.notifications.cancellationPushDescription"),
        },
      ],
    },
    {
      section: t("business.settings.notifications.reviewSection"),
      items: [
        {
          key: "newReviewEmail",
          label: t("business.settings.notifications.newReviewEmail"),
          description: t("business.settings.notifications.newReviewEmailDescription"),
        },
        {
          key: "newReviewPush",
          label: t("business.settings.notifications.newReviewPush"),
          description: t("business.settings.notifications.newReviewPushDescription"),
        },
        {
          key: "payoutEmail",
          label: t("business.settings.notifications.payoutEmail"),
          description: t("business.settings.notifications.payoutEmailDescription"),
        },
      ],
    },
  ];

  return (
    <BusinessSectionCard
      title={t("business.settings.notifications.title")}
      description={t("business.settings.notifications.description")}
    >
      <div className="space-y-6">
        {notificationGroups.map((group) => (
          <div key={group.section} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {group.section}
            </p>
            <div className="space-y-2">
              {group.items.map((item) => {
                const on = !!value[item.key];
                return (
                  <div
                    key={item.key}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border px-3 py-3 transition-colors",
                      on
                        ? "border-emerald-200/70 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                        : "border-zinc-200/80 dark:border-zinc-800"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                        {item.description}
                      </p>
                    </div>
                    <Switch
                      checked={on}
                      onCheckedChange={(checked) => onChange(item.key, checked)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </BusinessSectionCard>
  );
};

export default BusinessNotificationsTab;
