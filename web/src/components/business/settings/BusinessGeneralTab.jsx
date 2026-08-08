import { useTranslation } from "react-i18next";
import { Input, Label } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { BusinessSectionCard } from "@/components/business/ui/BusinessSectionCard";
import { BUSINESS_TOKENS } from "@/components/business/tokens/businessTokens";

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
      [day]: { ...value.operatingHours[day], [field]: fieldValue },
    });
  };

  return (
    <div className="space-y-6">
      <BusinessSectionCard
        title={t("business.settings.general.title")}
        description={t("business.settings.general.description")}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("business.settings.general.displayName")}
            </Label>
            <Input
              value={value.displayName || ""}
              onChange={(e) => onChange("displayName", e.target.value)}
              placeholder={t("business.settings.general.displayNamePlaceholder")}
              className={BUSINESS_TOKENS.inputBusiness}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("business.settings.general.desc")}
            </Label>
            <Textarea
              value={value.description || ""}
              onChange={(e) => onChange("description", e.target.value)}
              placeholder={t("business.settings.general.descPlaceholder")}
              rows={3}
              className="rounded-lg border-zinc-200 text-sm focus-visible:ring-zinc-950 focus-visible:border-zinc-400"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("business.settings.general.logoUrl")}
            </Label>
            <Input
              value={value.logoUrl || ""}
              onChange={(e) => onChange("logoUrl", e.target.value)}
              placeholder="https://..."
              className={BUSINESS_TOKENS.inputBusiness}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("business.settings.general.phone")}
              </Label>
              <Input
                value={value.contactPhone || ""}
                onChange={(e) => onChange("contactPhone", e.target.value)}
                placeholder="0xxx xxx xxx"
                className={BUSINESS_TOKENS.inputBusiness}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("business.settings.general.email")}
              </Label>
              <Input
                value={value.contactEmail || ""}
                onChange={(e) => onChange("contactEmail", e.target.value)}
                placeholder="contact@business.com"
                className={BUSINESS_TOKENS.inputBusiness}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("business.settings.general.address")}
            </Label>
            <Input
              value={value.address || ""}
              onChange={(e) => onChange("address", e.target.value)}
              placeholder={t("business.settings.general.addressPlaceholder")}
              className={BUSINESS_TOKENS.inputBusiness}
            />
          </div>
        </div>
      </BusinessSectionCard>

      <BusinessSectionCard
        title={t("business.settings.general.operatingHours")}
        description={t("business.settings.general.operatingHoursDesc")}
      >
        <div className="space-y-2">
          {days.map((day) => {
            const hours =
              value.operatingHours?.[day.key] || { open: "08:00", close: "22:00", closed: false };
            return (
              <div
                key={day.key}
                className="flex flex-col gap-2 rounded-lg border border-zinc-200/80 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3 dark:border-zinc-800"
              >
                <span className="w-24 shrink-0 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {day.label}
                </span>
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    type="time"
                    value={hours.open}
                    onChange={(e) => handleHoursChange(day.key, "open", e.target.value)}
                    disabled={hours.closed}
                    className={cn(BUSINESS_TOKENS.inputBusiness, "w-full sm:w-32")}
                  />
                  <span className="shrink-0 text-sm text-zinc-400">—</span>
                  <Input
                    type="time"
                    value={hours.close}
                    onChange={(e) => handleHoursChange(day.key, "close", e.target.value)}
                    disabled={hours.closed}
                    className={cn(BUSINESS_TOKENS.inputBusiness, "w-full sm:w-32")}
                  />
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t("business.settings.general.dayOff")}
                  </span>
                  <Switch
                    checked={hours.closed}
                    onCheckedChange={(checked) => handleHoursChange(day.key, "closed", checked)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </BusinessSectionCard>
    </div>
  );
};

export default BusinessGeneralTab;
