import { useTranslation } from "react-i18next";
import { Input, Label, Checkbox } from "@/components/ui";
import { Switch } from "@/components/ui/switch";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingSelectField from "@/pages/admin/settings/components/SettingSelectField";

const BookingRulesTab = ({ value, onChange }) => {
  const { t } = useTranslation();

  const noShowOptions = [
    { value: "none", label: t("business.settings.bookingRules.penaltyNone") },
    { value: "charge_25", label: t("business.settings.bookingRules.penalty25") },
    { value: "charge_50", label: t("business.settings.bookingRules.penalty50") },
    { value: "charge_100", label: t("business.settings.bookingRules.penalty100") },
    { value: "ban_user", label: t("business.settings.bookingRules.penaltyBan") },
  ];

  return (
    <div className="space-y-8">
      <SettingsSection
        title={t("business.settings.bookingRules.autoProcessing")}
        description={t("business.settings.bookingRules.autoProcessingDesc")}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-gray-200 px-3 sm:px-4 py-3 hover:border-black transition-colors">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wide">
              {t("business.settings.bookingRules.autoApprove")}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("business.settings.bookingRules.autoApproveDesc")}
            </p>
          </div>
          <Switch
            checked={!!value.autoApprove}
            onCheckedChange={(checked) => onChange("autoApprove", checked)}
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-gray-200 px-3 sm:px-4 py-3 hover:border-black transition-colors">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wide">
              {t("business.settings.bookingRules.allowOverbooking")}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("business.settings.bookingRules.allowOverbookingDesc")}
            </p>
          </div>
          <Switch
            checked={!!value.allowOverbooking}
            onCheckedChange={(checked) => onChange("allowOverbooking", checked)}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title={t("business.settings.bookingRules.timeLimits")}
        description={t("business.settings.bookingRules.timeLimitsDesc")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("business.settings.bookingRules.maxAdvanceDays")}
            </Label>
            <Input
              type="number"
              min={1}
              max={365}
              value={value.maxAdvanceDays ?? 30}
              onChange={(e) =>
                onChange("maxAdvanceDays", parseInt(e.target.value, 10))
              }
              className="rounded-none border-black"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("business.settings.bookingRules.minLeadMinutes")}
            </Label>
            <Input
              type="number"
              min={0}
              max={1440}
              value={value.minLeadMinutes ?? 0}
              onChange={(e) =>
                onChange("minLeadMinutes", parseInt(e.target.value, 10))
              }
              className="rounded-none border-black"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {t("business.settings.bookingRules.freeCancellationWindow")}
          </Label>
          <Input
            type="number"
            min={0}
            max={72}
            value={value.cancellationWindowHours ?? 24}
            onChange={(e) =>
              onChange("cancellationWindowHours", parseInt(e.target.value, 10))
            }
            className="rounded-none border-black"
          />
          <p className="font-mono text-[10px] text-muted-foreground">
            {t("business.settings.bookingRules.freeCancellationDesc")}
          </p>
        </div>
      </SettingsSection>

      <SettingsSection
        title={t("business.settings.bookingRules.noShowPolicy")}
        description={t("business.settings.bookingRules.noShowPolicyDesc")}
      >
        <SettingSelectField
          id="no-show-policy"
          label={t("business.settings.bookingRules.noShowPenalty")}
          value={value.noShowPolicy || "none"}
          onChange={(v) => onChange("noShowPolicy", v)}
          options={noShowOptions}
        />
      </SettingsSection>
    </div>
  );
};

export default BookingRulesTab;
