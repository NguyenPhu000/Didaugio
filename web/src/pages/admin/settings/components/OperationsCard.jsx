import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
} from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";

const OperationsCard = ({ value, onChange }) => {
  return (
    <Card className="rounded-none border-black bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-black uppercase tracking-wide">
          8) Bảo trì & Vận hành
        </CardTitle>
        <CardDescription className="font-mono text-xs uppercase tracking-wider text-gray-500">
          Maintenance mode, offline message và backup database/settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between border border-black px-3 py-2">
          <span className="font-mono text-[11px] uppercase">
            Backup enabled
          </span>
          <Checkbox
            checked={!!value.backupEnabled}
            onCheckedChange={(c) => onChange("backupEnabled", c === true)}
            className="rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
          />
        </div>
        <Input
          className="rounded-none border-black"
          value={value.backupFrequency}
          onChange={(e) => onChange("backupFrequency", e.target.value)}
          placeholder="Backup frequency"
        />
        <Textarea
          rows={3}
          className="rounded-none border-black focus-visible:ring-0"
          value={value.offlinePageMessage}
          onChange={(e) => onChange("offlinePageMessage", e.target.value)}
          placeholder="Offline page message"
        />
      </CardContent>
    </Card>
  );
};

export default OperationsCard;
