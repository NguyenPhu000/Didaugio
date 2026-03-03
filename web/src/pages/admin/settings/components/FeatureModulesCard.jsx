import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
} from "@/components/ui";

const FeatureModulesCard = ({ value, onChange }) => {
  const flags = [
    ["placeApproval", "Place approval"],
    ["routing", "Routing"],
    ["aiPlanner", "AI Planner"],
    ["notifications", "Notifications"],
    ["newsModule", "News module"],
    ["reportsModule", "Reports module"],
    ["cacheEnabled", "Cache enabled"],
  ];

  return (
    <Card className="rounded-none border-black bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-black uppercase tracking-wide">
          5) Feature & Module Settings
        </CardTitle>
        <CardDescription className="font-mono text-xs uppercase tracking-wider text-gray-500">
          Bật/tắt module, upload config, cache và performance
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
          placeholder="Max upload size (MB)"
        />
        <Input
          value={value.allowedFileTypes}
          onChange={(e) => onChange("allowedFileTypes", e.target.value)}
          className="rounded-none border-black"
          placeholder="Allowed file types"
        />
      </CardContent>
    </Card>
  );
};

export default FeatureModulesCard;
