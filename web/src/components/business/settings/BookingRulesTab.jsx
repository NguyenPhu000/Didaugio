import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BusinessSectionCard } from "@/components/business/ui/BusinessSectionCard";
import { BUSINESS_TOKENS } from "@/components/business/tokens/businessTokens";

const BookingRulesTab = ({ value, onChange }) => {
  const { t } = useTranslation();

  const noShowOptions = [
    { value: "none", label: t("business.settings.bookingRules.penaltyNone") },
    { value: "charge_25", label: t("business.settings.bookingRules.penalty25") },
    { value: "charge_50", label: t("business.settings.bookingRules.penalty50") },
    { value: "charge_100", label: t("business.settings.bookingRules.penalty100") },
    { value: "ban_user", label: t("business.settings.bookingRules.penaltyBan") },
  ];

  const toggleRow = (key, title, desc) => {
    const on = !!value[key];
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-200/80 px-3 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <div>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{title}</p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{desc}</p>
        </div>
        <Switch checked={on} onCheckedChange={(checked) => onChange(key, checked)} />
      </div>
    );
  };

  const numberField = (key, label, fallback, options) => {
    const current = String(value[key] ?? fallback);
    const values = options.map(String);
    const selectOptions = values.includes(current) ? values : [current, ...values];

    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</Label>
        <Select
          value={current}
          onValueChange={(next) => onChange(key, Number(next))}
        >
          <SelectTrigger className={BUSINESS_TOKENS.inputBusiness}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {selectOptions.map((option) => (
              <SelectItem key={option} value={option} className="text-sm">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <BusinessSectionCard
        title={t("business.settings.bookingRules.autoProcessing")}
        description={t("business.settings.bookingRules.autoProcessingDesc")}
      >
        <div className="space-y-2">
          {toggleRow(
            "autoApprove",
            t("business.settings.bookingRules.autoApprove"),
            t("business.settings.bookingRules.autoApproveDesc")
          )}
          {toggleRow(
            "allowOverbooking",
            t("business.settings.bookingRules.allowOverbooking"),
            t("business.settings.bookingRules.allowOverbookingDesc")
          )}
        </div>
      </BusinessSectionCard>

      <BusinessSectionCard
        title={t("business.settings.bookingRules.timeLimits")}
        description={t("business.settings.bookingRules.timeLimitsDesc")}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {numberField("maxAdvanceDays", t("business.settings.bookingRules.maxAdvanceDays"), 30, [1, 7, 14, 30, 60, 90, 180, 365])}
            {numberField("minLeadMinutes", t("business.settings.bookingRules.minLeadMinutes"), 0, [0, 15, 30, 60, 120, 240, 1440])}
          </div>
          <div className="space-y-1.5">
            {numberField("cancellationWindowHours", t("business.settings.bookingRules.freeCancellationWindow"), 24, [0, 1, 2, 4, 12, 24, 48, 72])}
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("business.settings.bookingRules.freeCancellationDesc")}
            </p>
          </div>
        </div>
      </BusinessSectionCard>

      <BusinessSectionCard
        title={t("business.settings.bookingRules.noShowPolicy")}
        description={t("business.settings.bookingRules.noShowPolicyDesc")}
      >
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("business.settings.bookingRules.noShowPenalty")}
          </Label>
          <Select
            value={value.noShowPolicy || "none"}
            onValueChange={(v) => onChange("noShowPolicy", v)}
          >
            <SelectTrigger className="h-9 rounded-lg border-zinc-200 text-sm focus:ring-zinc-950">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {noShowOptions.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-sm">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </BusinessSectionCard>
    </div>
  );
};

export default BookingRulesTab;
