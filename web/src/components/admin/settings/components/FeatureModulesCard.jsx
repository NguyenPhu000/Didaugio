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

const FeatureModulesCard = ({ value, onChange }) => {
  const { t } = useTranslation();
  const flags = [
    ["placeApproval", t("settings.features.placeApproval")],
    ["routing", t("settings.features.routing")],
    ["aiPlanner", t("settings.features.aiPlanner")],
    ["notifications", t("settings.features.notifications")],
    ["newsModule", t("settings.features.newsModule")],
    ["reportsModule", t("settings.features.reportsModule")],
    ["cacheEnabled", t("settings.features.cacheEnabled")],
  ];

  return (
    <Card className="rounded-none border-black bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-black uppercase tracking-wide">
          {t("settings.features.title")}
        </CardTitle>
        <CardDescription className="font-mono text-xs uppercase tracking-wider text-gray-500">
          {t("settings.features.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {flags.map(([key, label]) => (
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
          value={value.maxUploadSizeMb}
          onChange={(e) => onChange("maxUploadSizeMb", e.target.value)}
          className="rounded-none border-black"
          placeholder={t("settings.features.maxUploadSizeMb")}
        />
        <Input
          value={value.allowedFileTypes}
          onChange={(e) => onChange("allowedFileTypes", e.target.value)}
          className="rounded-none border-black"
          placeholder={t("settings.features.allowedFileTypes")}
        />
      </CardContent>
    </Card>
  );
};

export default FeatureModulesCard;
