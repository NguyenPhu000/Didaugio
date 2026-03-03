import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
} from "@/components/ui";

const SecuritySettingsCard = ({ value, onChange }) => {
  const toggles = [
    ["require2FA", "Bật 2FA"],
    ["lockoutEnabled", "Lockout sau nhiều lần sai"],
    ["csrfProtection", "CSRF protection"],
    ["xssProtection", "XSS protection"],
    ["secureApiLogin", "API login security"],
  ];

  return (
    <Card className="rounded-none border-black bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-black uppercase tracking-wide">
          4) Bảo mật (Security)
        </CardTitle>
        <CardDescription className="font-mono text-xs uppercase tracking-wider text-gray-500">
          2FA, lockout, session timeout, CSRF/XSS và bảo mật API login
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          type="number"
          className="rounded-none border-black"
          value={value.sessionTimeoutMinutes}
          onChange={(e) => onChange("sessionTimeoutMinutes", e.target.value)}
          placeholder="Session timeout (minutes)"
        />

        <div className="grid grid-cols-1 gap-2">
          {toggles.map(([key, label]) => (
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
      </CardContent>
    </Card>
  );
};

export default SecuritySettingsCard;
