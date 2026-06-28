import { AlertTriangle, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/Button";
import { Link } from "react-router-dom";
import { BUSINESS_ROUTES } from "@/constants/routes";

const STATUS_CONFIG = {
  grace: {
    icon: Clock,
    variant: "warning",
    titleKey: "subscription.status.grace",
  },
  past_due: {
    icon: AlertTriangle,
    variant: "destructive",
    titleKey: "subscription.status.past_due",
  },
};

export default function GracePeriodBanner({ subscription }) {
  const { t } = useTranslation();

  if (!subscription || !["grace", "past_due"].includes(subscription.status)) {
    return null;
  }

  const config = STATUS_CONFIG[subscription.status];
  const Icon = config.icon;
  const daysLeft = subscription.gracePeriodEnd
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.gracePeriodEnd) - new Date()) / (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  return (
    <Alert variant={config.variant} className="border-amber-200 bg-amber-50">
      <Icon className="h-4 w-4" />
      <AlertTitle>{t(config.titleKey)}</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>
          {daysLeft !== null
            ? t("subscription.grace.warning", { days: daysLeft })
            : t("subscription.status.past_due")}
        </span>
        <Button asChild size="sm" variant="outline">
          <Link to={BUSINESS_ROUTES.SUBSCRIPTION_PLANS}>
            {t("subscription.upgradeBtn")}
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
