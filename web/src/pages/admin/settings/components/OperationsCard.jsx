import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
} from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import SettingSelectField from "./SettingSelectField";
import { BACKUP_FREQUENCY_OPTIONS } from "../settingsSelectOptions";

const OperationsCard = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <Card className="rounded-none border-black bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-black uppercase tracking-wide">
          {t("settings.operations.title")}
        </CardTitle>
        <CardDescription className="font-mono text-xs uppercase tracking-wider text-gray-500">
          {t("settings.operations.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between border border-black px-3 py-2">
          <span className="font-mono text-[11px] uppercase">
            {t("settings.operations.backupEnabled")}
          </span>
          <Checkbox
            checked={!!value.backupEnabled}
            onCheckedChange={(c) => onChange("backupEnabled", c === true)}
            className="rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
          />
        </div>
        <SettingSelectField
          id="settings-backup-frequency"
          label={t("settings.operations.backupFrequency")}
          value={value.backupFrequency}
          onChange={(v) => onChange("backupFrequency", v)}
          options={BACKUP_FREQUENCY_OPTIONS}
        />
        <Textarea
          rows={3}
          className="rounded-none border-black focus-visible:ring-0"
          value={value.offlinePageMessage}
          onChange={(e) => onChange("offlinePageMessage", e.target.value)}
          placeholder={t("settings.operations.offlinePageMessage")}
        />
      </CardContent>
    </Card>
  );
};

export default OperationsCard;
