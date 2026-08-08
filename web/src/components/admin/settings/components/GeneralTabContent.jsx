import { useTranslation } from "react-i18next";
import { Input, Label } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingSelectField from "./SettingSelectField";
import {
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
} from "../settingsSelectOptions";

const Field = ({ id, label, children, help }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-xs font-semibold text-zinc-600">
      {label}
    </Label>
    {children}
    {help ? <p className="text-xs leading-relaxed text-zinc-500">{help}</p> : null}
  </div>
);

const inputClassName =
  "h-10 rounded-xl border-black/30 bg-white text-sm focus-visible:ring-black/10";

const GeneralTabContent = ({ value, onChange }) => {
  const { t } = useTranslation();

  return (
    <SettingsSection
      title={t("settings.general.title")}
      description={t("settings.general.description")}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field id="settings-site-name" label={t("settings.general.siteName")}>
          <Input
            id="settings-site-name"
            className={inputClassName}
            value={value.siteName}
            onChange={(e) => onChange("siteName", e.target.value)}
          />
        </Field>
        <Field id="settings-logo-url" label={t("settings.general.logoUrl", { defaultValue: "Logo URL" })}>
          <Input
            id="settings-logo-url"
            className={inputClassName}
            value={value.logoUrl}
            onChange={(e) => onChange("logoUrl", e.target.value)}
          />
        </Field>
        <Field id="settings-favicon-url" label={t("settings.general.faviconUrl", { defaultValue: "Favicon URL" })}>
          <Input
            id="settings-favicon-url"
            className={inputClassName}
            value={value.faviconUrl}
            onChange={(e) => onChange("faviconUrl", e.target.value)}
          />
        </Field>
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

      <Field
        id="settings-site-description"
        label={t("settings.general.siteDescription")}
      >
        <Textarea
          id="settings-site-description"
          rows={3}
          className="rounded-xl border-black/30 text-sm focus-visible:ring-black/10"
          value={value.siteDescription}
          onChange={(e) => onChange("siteDescription", e.target.value)}
        />
      </Field>
    </SettingsSection>
  );
};

export default GeneralTabContent;
