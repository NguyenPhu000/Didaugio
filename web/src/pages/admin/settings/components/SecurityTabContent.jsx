import { Switch } from "@/components/ui/switch";
import { Input, Label, Slider } from "@/components/ui";
import SettingsSection from "@/components/settings/SettingsSection";

const SECURITY_TOGGLES = [
  { key: "require2FA", label: "Xác thực hai yếu tố (2FA)" },
  { key: "lockoutEnabled", label: "Khóa tài khoản sau nhiều lần sai" },
  { key: "csrfProtection", label: "Chống CSRF" },
  { key: "xssProtection", label: "Chống XSS" },
];

const SecurityTabContent = ({ value, onChange }) => (
  <div className="space-y-8">
    <SettingsSection
      title="Xác thực & Phiên làm việc"
      description="Cấu hình bảo mật đăng nhập và quản lý phiên"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Thời gian hết hạn phiên: {value.sessionTimeoutMinutes} phút
          </Label>
          <Slider
            value={[value.sessionTimeoutMinutes || 30]}
            onValueChange={([v]) => onChange("sessionTimeoutMinutes", v)}
            min={5}
            max={480}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
            <span>5 phút</span>
            <span>8 giờ</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Số lần đăng nhập tối đa
            </Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={value.maxLoginAttempts || 5}
              onChange={(e) =>
                onChange("maxLoginAttempts", parseInt(e.target.value, 10))
              }
              className="rounded-none border-black"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Độ dài mật khẩu tối thiểu
            </Label>
            <Input
              type="number"
              min={6}
              max={32}
              value={value.passwordMinLength || 8}
              onChange={(e) =>
                onChange("passwordMinLength", parseInt(e.target.value, 10))
              }
              className="rounded-none border-black"
            />
          </div>
        </div>
      </div>
    </SettingsSection>

    <SettingsSection
      title="Bảo vệ hệ thống"
      description="Các cơ chế bảo vệ tích hợp"
    >
      <div className="space-y-1">
        {SECURITY_TOGGLES.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between border border-gray-200 px-4 py-3 hover:border-black transition-colors"
          >
            <span className="font-mono text-xs uppercase tracking-wide">
              {item.label}
            </span>
            <Switch
              checked={!!value[item.key]}
              onCheckedChange={(checked) => onChange(item.key, checked)}
            />
          </div>
        ))}
      </div>
    </SettingsSection>
  </div>
);

export default SecurityTabContent;
