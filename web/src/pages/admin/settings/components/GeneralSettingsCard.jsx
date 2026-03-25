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
import SettingSelectField from "./SettingSelectField";
import {
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
} from "../settingsSelectOptions";

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
          <SettingSelectField
            id="settings-currency"
            label="Đơn vị tiền tệ"
            value={value.currency}
            onChange={(v) => onChange("currency", v)}
            options={CURRENCY_OPTIONS}
          />
          <SettingSelectField
            id="settings-language"
            label="Ngôn ngữ"
            value={value.language}
            onChange={(v) => onChange("language", v)}
            options={LANGUAGE_OPTIONS}
          />
          <SettingSelectField
            id="settings-timezone"
            label="Múi giờ"
            value={value.timezone}
            onChange={(v) => onChange("timezone", v)}
            options={TIMEZONE_OPTIONS}
          />
          <SettingSelectField
            id="settings-date-format"
            label="Định dạng ngày"
            value={value.dateFormat}
            onChange={(v) => onChange("dateFormat", v)}
            options={DATE_FORMAT_OPTIONS}
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
