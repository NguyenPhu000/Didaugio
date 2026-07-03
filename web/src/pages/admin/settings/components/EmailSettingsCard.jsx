import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Button,
} from "@/components/ui";
import { useTranslation } from "react-i18next";
import SettingSelectField from "./SettingSelectField";
import { SMTP_PORT_OPTIONS } from "../settingsSelectOptions";

const EmailSettingsCard = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <Card className="rounded-none border-black bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-black uppercase tracking-wide">
          {t("settings.email.title")}
        </CardTitle>
        <CardDescription className="font-mono text-xs uppercase tracking-wider text-gray-500">
          {t("settings.email.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            className="rounded-none border-black"
            value={value.smtpHost}
            onChange={(e) => onChange("smtpHost", e.target.value)}
            placeholder="SMTP Host"
          />
          <SettingSelectField
            id="settings-smtp-port"
            label={t("settings.email.smtpPort")}
            value={value.smtpPort != null ? String(value.smtpPort) : ""}
            onChange={(v) => onChange("smtpPort", v)}
            options={SMTP_PORT_OPTIONS}
          />
          <Input
            className="rounded-none border-black md:col-span-2"
            value={value.defaultFromEmail}
            onChange={(e) => onChange("defaultFromEmail", e.target.value)}
            placeholder={t("settings.email.fromEmail")}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center justify-between border border-black px-3 py-2">
            <span className="font-mono text-[11px] uppercase">Use TLS</span>
            <Checkbox
              checked={!!value.useTLS}
              onCheckedChange={(c) => onChange("useTLS", c === true)}
              className="rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
            />
          </div>
          <div className="flex items-center justify-between border border-black px-3 py-2">
            <span className="font-mono text-[11px] uppercase">Use SSL</span>
            <Checkbox
              checked={!!value.useSSL}
              onCheckedChange={(c) => onChange("useSSL", c === true)}
              className="rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
            />
          </div>
          <div className="flex items-center justify-between border border-black px-3 py-2">
            <span className="font-mono text-[11px] uppercase">
              Notifications
            </span>
            <Checkbox
              checked={!!value.notificationsEnabled}
              onCheckedChange={(c) =>
                onChange("notificationsEnabled", c === true)
              }
              className="rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
            />
          </div>
        </div>

        <Button
          type="button"
          className="rounded-none border border-black bg-white text-black hover:bg-black hover:text-white uppercase font-bold text-xs"
        >
          {t("settings.email.testSendEmail")}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmailSettingsCard;
