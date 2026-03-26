import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";
import SettingSelectField from "./SettingSelectField";
import {
  ANALYTICS_PROVIDER_OPTIONS,
  PAYMENT_PROVIDER_OPTIONS,
} from "../settingsSelectOptions";

const IntegrationsCard = ({ value, onChange }) => {
  return (
    <Card className="rounded-none border-black bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-black uppercase tracking-wide">
          6) Tích hợp & API
        </CardTitle>
        <CardDescription className="font-mono text-xs uppercase tracking-wider text-gray-500">
          API keys, webhook endpoint và dịch vụ bên thứ 3
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
          label="Analytics"
          value={value.analyticsProvider}
          onChange={(v) => onChange("analyticsProvider", v)}
          options={ANALYTICS_PROVIDER_OPTIONS}
        />
        <SettingSelectField
          id="settings-payment-provider"
          label="Cổng thanh toán"
          value={value.paymentProvider}
          onChange={(v) => onChange("paymentProvider", v)}
          options={PAYMENT_PROVIDER_OPTIONS}
        />
      </CardContent>
    </Card>
  );
};

export default IntegrationsCard;
