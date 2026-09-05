import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";
import { useTranslation } from "react-i18next";
import SettingSelectField from "./SettingSelectField";
import {
  ANALYTICS_PROVIDER_OPTIONS,
  PAYMENT_PROVIDER_OPTIONS,
} from "../settingsSelectOptions";

const IntegrationsCard = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <Card className="rounded-none border-black bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-black uppercase tracking-wide">
          {t("settings.integrations.title")}
        </CardTitle>
        <CardDescription className="font-mono text-xs uppercase tracking-wider text-gray-500">
          {t("settings.integrations.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          className="rounded-none border-black"
          value={value.googleApiKey}
          onChange={(e) => onChange("googleApiKey", e.target.value)}
          placeholder="Google API Key"
        />
        <Input
          className="rounded-none border-black"
          value={value.facebookAppId}
          onChange={(e) => onChange("facebookAppId", e.target.value)}
          placeholder="Facebook App ID"
        />
        <Input
          className="rounded-none border-black"
          value={value.webhookEndpoint}
          onChange={(e) => onChange("webhookEndpoint", e.target.value)}
          placeholder="Webhook Endpoint"
        />
        <SettingSelectField
          id="settings-analytics-provider"
          label={t("settings.integrations.analytics")}
          value={value.analyticsProvider}
          onChange={(v) => onChange("analyticsProvider", v)}
          options={ANALYTICS_PROVIDER_OPTIONS}
        />
        <SettingSelectField
          id="settings-payment-provider"
          label={t("settings.integrations.paymentProvider")}
          value={value.paymentProvider}
          onChange={(v) => onChange("paymentProvider", v)}
          options={PAYMENT_PROVIDER_OPTIONS}
        />
      </CardContent>
    </Card>
  );
};

export default IntegrationsCard;
