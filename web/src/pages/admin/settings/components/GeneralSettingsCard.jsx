import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
} from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import SettingSelectField from "./SettingSelectField";
import {
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
} from "../settingsSelectOptions";

const GeneralSettingsCard = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <Card className="rounded-none border-black bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-black uppercase tracking-wide">
          {t("settings.general.title")}
        </CardTitle>
        <CardDescription className="font-mono text-xs uppercase tracking-wider text-gray-500">
          {t("settings.general.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            className="rounded-none border-black"
            value={value.siteName}
            onChange={(e) => onChange("siteName", e.target.value)}
            placeholder={t("settings.general.siteName")}
          />
          <Input
            className="rounded-none border-black"
            value={value.domain}
            onChange={(e) => onChange("domain", e.target.value)}
            placeholder="Domain"
          />
          <Input
            className="rounded-none border-black"
            value={value.baseUrl}
            onChange={(e) => onChange("baseUrl", e.target.value)}
            placeholder="Base URL"
          />
          <SettingSelectField
            id="settings-currency"
            label={t("settings.general.currency")}
            value={value.currency}
            onChange={(v) => onChange("currency", v)}
            options={CURRENCY_OPTIONS}
          />
          <SettingSelectField
            id="settings-language"
            label={t("settings.general.defaultLanguage")}
            value={value.language}
            onChange={(v) => onChange("language", v)}
            options={LANGUAGE_OPTIONS}
          />
          <SettingSelectField
            id="settings-timezone"
            label={t("settings.general.timezone")}
            value={value.timezone}
            onChange={(v) => onChange("timezone", v)}
            options={TIMEZONE_OPTIONS}
          />
          <SettingSelectField
            id="settings-date-format"
            label={t("settings.general.dateFormat")}
            value={value.dateFormat}
            onChange={(v) => onChange("dateFormat", v)}
            options={DATE_FORMAT_OPTIONS}
          />
          <Input
            className="rounded-none border-black"
            value={value.logoUrl}
            onChange={(e) => onChange("logoUrl", e.target.value)}
            placeholder="Logo URL"
          />
          <Input
            className="rounded-none border-black md:col-span-2"
            value={value.faviconUrl}
            onChange={(e) => onChange("faviconUrl", e.target.value)}
            placeholder="Favicon URL"
          />
        </div>

        <Textarea
          rows={3}
          className="rounded-none border-black focus-visible:ring-0"
          value={value.siteDescription}
          onChange={(e) => onChange("siteDescription", e.target.value)}
          placeholder={t("settings.general.siteDescription")}
        />

        <div className="flex items-center justify-between border border-black px-3 py-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider">
            {t("settings.general.maintenanceMode")}
          </span>
          <Checkbox
            checked={!!value.maintenanceMode}
            onCheckedChange={(checked) =>
              onChange("maintenanceMode", checked === true)
            }
            className="rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralSettingsCard;
