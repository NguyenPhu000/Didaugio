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

const GeneralSettingsCard = ({ value, onChange }) => {
  return (
    <Card className="rounded-none border-black bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-black uppercase tracking-wide">
          1) Cài Đặt Chung
        </CardTitle>
        <CardDescription className="font-mono text-xs uppercase tracking-wider text-gray-500">
          Tên hệ thống, logo/favicon, ngôn ngữ, múi giờ, domain và maintenance
          mode
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            className="rounded-none border-black"
            value={value.siteName}
            onChange={(e) => onChange("siteName", e.target.value)}
            placeholder="Tên website"
          />
          <Input
            className="rounded-none border-black"
            value={value.domain}
            onChange={(e) => onChange("domain", e.target.value)}
            placeholder="Domain"
          />
          <Input
            className="rounded-none border-black"
            value={value.baseUrl}
            onChange={(e) => onChange("baseUrl", e.target.value)}
            placeholder="Base URL"
          />
          <Input
            className="rounded-none border-black"
            value={value.currency}
            onChange={(e) => onChange("currency", e.target.value)}
            placeholder="Đơn vị tiền tệ"
          />
          <Input
            className="rounded-none border-black"
            value={value.language}
            onChange={(e) => onChange("language", e.target.value)}
            placeholder="Ngôn ngữ"
          />
          <Input
            className="rounded-none border-black"
            value={value.timezone}
            onChange={(e) => onChange("timezone", e.target.value)}
            placeholder="Múi giờ"
          />
          <Input
            className="rounded-none border-black"
            value={value.dateFormat}
            onChange={(e) => onChange("dateFormat", e.target.value)}
            placeholder="Định dạng ngày giờ"
          />
          <Input
            className="rounded-none border-black"
            value={value.logoUrl}
            onChange={(e) => onChange("logoUrl", e.target.value)}
            placeholder="Logo URL"
          />
          <Input
            className="rounded-none border-black md:col-span-2"
            value={value.faviconUrl}
            onChange={(e) => onChange("faviconUrl", e.target.value)}
            placeholder="Favicon URL"
          />
        </div>

        <Textarea
          rows={3}
          className="rounded-none border-black focus-visible:ring-0"
          value={value.siteDescription}
          onChange={(e) => onChange("siteDescription", e.target.value)}
          placeholder="Mô tả website"
        />

        <div className="flex items-center justify-between border border-black px-3 py-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider">
            Maintenance mode
          </span>
          <Checkbox
            checked={!!value.maintenanceMode}
            onCheckedChange={(checked) =>
              onChange("maintenanceMode", checked === true)
            }
            className="rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralSettingsCard;
