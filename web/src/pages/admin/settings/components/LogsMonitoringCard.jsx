import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
} from "@/components/ui";
import { useTranslation } from "react-i18next";

const LogsMonitoringCard = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <Card className="rounded-none border-black bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-black uppercase tracking-wide">
          {t("settings.logs.title")}
        </CardTitle>
        <CardDescription className="font-mono text-xs uppercase tracking-wider text-gray-500">
          {t("settings.logs.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            ["auditLogEnabled", t("settings.logs.auditLogEnabled")],
            ["errorLogEnabled", t("settings.logs.errorLogEnabled")],
            ["allowLogAccess", t("settings.logs.allowLogAccess")],
          ].map(([key, label]) => (
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
        <Input
          type="number"
          className="rounded-none border-black"
          value={value.retentionDays}
          onChange={(e) => onChange("retentionDays", e.target.value)}
          placeholder={t("settings.logs.retentionDays")}
        />
      </CardContent>
    </Card>
  );
};

export default LogsMonitoringCard;
