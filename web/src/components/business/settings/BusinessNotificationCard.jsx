import { useTranslation } from "react-i18next";
import { Checkbox, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Bell } from "lucide-react";

const BusinessNotificationCard = ({ value, onChange }) => {
  const { t } = useTranslation();

  const toggles = [
    ["newBookingEmail", t("business.settings.notifications.newBookingEmail")],
    ["newBookingPush", t("business.settings.notifications.newBookingPush")],
    ["newReviewEmail", t("business.settings.notifications.newReviewEmail")],
    ["newReviewPush", t("business.settings.notifications.newReviewPush")],
    ["cancellationEmail", t("business.settings.notifications.cancellationEmail")],
  ];

  return (
    <Card className="rounded-none border-black bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-black uppercase tracking-wide flex items-center gap-2">
          <Bell className="h-4 w-4" />
          {t("business.settings.notifications.cardTitle")}
        </CardTitle>
        <CardDescription className="font-mono text-xs uppercase tracking-wider text-gray-500">
          {t("business.settings.notifications.cardDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {toggles.map(([key, label]) => (
          <div
            key={key}
            className="flex items-center justify-between border border-black px-3 py-2"
          >
            <span className="font-mono text-[11px] uppercase">{label}</span>
            <Checkbox
              checked={!!value[key]}
              onCheckedChange={(c) => onChange(key, c === true)}
              className="rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default BusinessNotificationCard;
