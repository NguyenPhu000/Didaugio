import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingSelectField from "./SettingSelectField";
import {
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
} from "../settingsSelectOptions";

const GeneralTabContent = ({ value, onChange }) => {
  const { t } = useTranslation();

  return (
    <SettingsSection
      title={t("settings.general.title")}
      description={t("settings.general.description")}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          className="rounded-none border-black"
          value={value.siteName}
          onChange={(e) => onChange("siteName", e.target.value)}
          placeholder={t("settings.general.siteName")}
        />
        <Input
          className="rounded-none border-black"
          value={value.logoUrl}
          onChange={(e) => onChange("logoUrl", e.target.value)}
          placeholder="Logo URL"
        />
        <Input
          className="rounded-none border-black"
          value={value.faviconUrl}
          onChange={(e) => onChange("faviconUrl", e.target.value)}
          placeholder="Favicon URL"
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
      </div>

      <Textarea
        rows={3}
        className="rounded-none border-black focus-visible:ring-0"
        value={value.siteDescription}
        onChange={(e) => onChange("siteDescription", e.target.value)}
        placeholder={t("settings.general.siteDescription")}
      />
    </SettingsSection>
  );
};

export default GeneralTabContent;
