import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
} from "@/components/ui";

const LogsMonitoringCard = ({ value, onChange }) => {
  return (
    <Card className="rounded-none border-black bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-black uppercase tracking-wide">
          7) Logs & Monitoring
        </CardTitle>
        <CardDescription className="font-mono text-xs uppercase tracking-wider text-gray-500">
          Audit logs, error logs và quyền truy cập logs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            ["auditLogEnabled", "Audit log"],
            ["errorLogEnabled", "Error log"],
            ["allowLogAccess", "Log access"],
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
          placeholder="Retention days"
        />
      </CardContent>
    </Card>
  );
};

export default LogsMonitoringCard;
