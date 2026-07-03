import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
} from "@/components/ui";
import { useTranslation } from "react-i18next";
import SettingSelectField from "./SettingSelectField";
import { SESSION_TIMEOUT_OPTIONS } from "../settingsSelectOptions";

const SecuritySettingsCard = ({ value, onChange }) => {
  const { t } = useTranslation();
  const toggles = [
    ["require2FA", t("settings.security.requireTwoFactor")],
    ["lockoutEnabled", t("settings.security.lockoutEnabled")],
    ["csrfProtection", t("settings.security.csrfProtection")],
    ["xssProtection", t("settings.security.xssProtection")],
    ["secureApiLogin", t("settings.security.secureApiLogin")],
  ];

  return (
    <Card className="rounded-none border-black bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-black uppercase tracking-wide">
          {t("settings.security.title")}
        </CardTitle>
        <CardDescription className="font-mono text-xs uppercase tracking-wider text-gray-500">
          {t("settings.security.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <SettingSelectField
          id="settings-session-timeout"
          label={t("settings.security.sessionTimeout")}
          value={
            value.sessionTimeoutMinutes != null
              ? String(value.sessionTimeoutMinutes)
              : ""
          }
          onChange={(v) => onChange("sessionTimeoutMinutes", v)}
          options={SESSION_TIMEOUT_OPTIONS}
        />

        <div className="grid grid-cols-1 gap-2">
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
        </div>
      </CardContent>
    </Card>
  );
};

export default SecuritySettingsCard;
