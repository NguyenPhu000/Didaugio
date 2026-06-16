import { useTranslation } from "react-i18next";
import { Input, Label } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import SettingsSection from "@/components/settings/SettingsSection";

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const BusinessGeneralTab = ({ value, onChange }) => {
  const { t } = useTranslation();

  const days = DAY_KEYS.map((key) => ({
    key,
    label: t(`business.settings.general.days.${key}`),
  }));

  const handleHoursChange = (day, field, fieldValue) => {
    onChange("operatingHours", {
      ...value.operatingHours,
      [day]: {
        ...value.operatingHours[day],
        [field]: fieldValue,
      },
    });
  };

  return (
    <div className="space-y-8">
      <SettingsSection
        title={t("business.settings.general.title")}
        description={t("business.settings.general.description")}
      >
        <div className="space-y-1">
          <Label className="font-mono text-[11px] uppercase">{t("business.settings.general.displayName")}</Label>
          <Input
            value={value.displayName || ""}
            onChange={(e) => onChange("displayName", e.target.value)}
            placeholder={t("business.settings.general.displayNamePlaceholder")}
            className="rounded-none border-black"
          />
        </div>
        <div className="space-y-1">
          <Label className="font-mono text-[11px] uppercase">{t("business.settings.general.desc")}</Label>
          <Textarea
            value={value.description || ""}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder={t("business.settings.general.descPlaceholder")}
            rows={3}
            className="rounded-none border-black focus-visible:ring-0"
          />
        </div>
        <div className="space-y-1">
          <Label className="font-mono text-[11px] uppercase">{t("business.settings.general.logoUrl")}</Label>
          <Input
            value={value.logoUrl || ""}
            onChange={(e) => onChange("logoUrl", e.target.value)}
            placeholder="https://..."
            className="rounded-none border-black"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="font-mono text-[11px] uppercase">{t("business.settings.general.phone")}</Label>
            <Input
              value={value.contactPhone || ""}
              onChange={(e) => onChange("contactPhone", e.target.value)}
              placeholder="0xxx xxx xxx"
              className="rounded-none border-black"
            />
          </div>
          <div className="space-y-1">
            <Label className="font-mono text-[11px] uppercase">{t("business.settings.general.email")}</Label>
            <Input
              value={value.contactEmail || ""}
              onChange={(e) => onChange("contactEmail", e.target.value)}
              placeholder="contact@business.com"
              className="rounded-none border-black"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="font-mono text-[11px] uppercase">{t("business.settings.general.address")}</Label>
          <Input
            value={value.address || ""}
            onChange={(e) => onChange("address", e.target.value)}
            placeholder={t("business.settings.general.addressPlaceholder")}
            className="rounded-none border-black"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title={t("business.settings.general.operatingHours")}
        description={t("business.settings.general.operatingHoursDesc")}
      >
        <div className="space-y-2">
          {days.map((day) => {
            const hours = value.operatingHours?.[day.key] || {
              open: "08:00",
              close: "22:00",
              closed: false,
            };
            return (
              <div
                key={day.key}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border border-gray-200 px-3 sm:px-4 py-2 hover:border-black transition-colors"
              >
                <span className="font-mono text-xs font-bold uppercase sm:w-20 shrink-0">
                  {day.label}
                </span>
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={hours.open}
                    onChange={(e) =>
                      handleHoursChange(day.key, "open", e.target.value)
                    }
                    disabled={hours.closed}
                    className="rounded-none border-black w-full sm:w-28 font-mono text-xs"
                  />
                  <span className="font-mono text-xs text-muted-foreground shrink-0">
                    —
                  </span>
                  <Input
                    type="time"
                    value={hours.close}
                    onChange={(e) =>
                      handleHoursChange(day.key, "close", e.target.value)
                    }
                    disabled={hours.closed}
                    className="rounded-none border-black w-full sm:w-28 font-mono text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">
                    {t("business.settings.general.dayOff")}
                  </span>
                  <Switch
                    checked={hours.closed}
                    onCheckedChange={(checked) =>
                      handleHoursChange(day.key, "closed", checked)
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SettingsSection>
    </div>
  );
};

export default BusinessGeneralTab;
