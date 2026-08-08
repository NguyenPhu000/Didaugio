import { Switch } from "@/components/ui/switch";
import { Label, Slider } from "@/components/ui";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingSelectField from "./SettingSelectField";

const SECURITY_TOGGLES = [
  ["require2FA", "Xác thực hai yếu tố (2FA)", "Yêu cầu mã xác thực khi đăng nhập."],
  ["lockoutEnabled", "Khóa tài khoản sau nhiều lần sai", "Tạm khóa sau nhiều lần đăng nhập thất bại."],
  ["csrfProtection", "Chống CSRF", "Bảo vệ các request thay đổi dữ liệu."],
  ["xssProtection", "Chống XSS", "Lọc nội dung nguy hiểm từ dữ liệu đầu vào."],
];

const LOGIN_ATTEMPTS = [3, 5, 10, 15, 20].map((value) => ({
  value: String(value),
  label: `${value} lần`,
}));

const PASSWORD_LENGTHS = [8, 10, 12, 14, 16].map((value) => ({
  value: String(value),
  label: `${value} ký tự`,
}));

const SecurityTabContent = ({ value, onChange }) => (
  <div className="space-y-8">
    <SettingsSection
      title="Xác thực & phiên làm việc"
      description="Chọn mức bảo vệ đăng nhập mà không cần nhập nhiều thông số."
    >
      <div className="space-y-5">
        <div className="space-y-2 rounded-xl bg-zinc-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-semibold text-zinc-800">
              Thời gian hết hạn phiên
            </Label>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700">
              {value.sessionTimeoutMinutes || 30} phút
            </span>
          </div>
          <Slider
            value={[value.sessionTimeoutMinutes || 30]}
            onValueChange={([v]) => onChange("sessionTimeoutMinutes", v)}
            min={5}
            max={480}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-zinc-500">
            <span>5 phút</span>
            <span>8 giờ</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SettingSelectField
            id="settings-max-login-attempts"
            label="Số lần đăng nhập tối đa"
            value={value.maxLoginAttempts || 5}
            onChange={(v) => onChange("maxLoginAttempts", Number(v))}
            options={LOGIN_ATTEMPTS}
          />
          <SettingSelectField
            id="settings-password-min-length"
            label="Độ dài mật khẩu tối thiểu"
            value={value.passwordMinLength || 8}
            onChange={(v) => onChange("passwordMinLength", Number(v))}
            options={PASSWORD_LENGTHS}
          />
        </div>
      </div>
    </SettingsSection>

    <SettingsSection
      title="Bảo vệ hệ thống"
      description="Các lớp bảo vệ hoạt động độc lập với Save cài đặt chung."
    >
      <div className="space-y-2">
        {SECURITY_TOGGLES.map(([key, label, description]) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-zinc-900">{label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{description}</p>
            </div>
            <Switch
              checked={!!value[key]}
              onCheckedChange={(checked) => onChange(key, checked)}
            />
          </div>
        ))}
      </div>
    </SettingsSection>
  </div>
);

export default SecurityTabContent;
