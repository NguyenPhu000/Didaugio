import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Button,
} from "@/components/ui";

const EmailSettingsCard = ({ value, onChange }) => {
  return (
    <Card className="rounded-none border-black bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-black uppercase tracking-wide">
          3) Email (SMTP / Notifications)
        </CardTitle>
        <CardDescription className="font-mono text-xs uppercase tracking-wider text-gray-500">
          SMTP host/port, email gửi mặc định, SSL/TLS và test gửi email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            className="rounded-none border-black"
            value={value.smtpHost}
            onChange={(e) => onChange("smtpHost", e.target.value)}
            placeholder="SMTP Host"
          />
          <Input
            className="rounded-none border-black"
            value={value.smtpPort}
            onChange={(e) => onChange("smtpPort", e.target.value)}
            placeholder="SMTP Port"
          />
          <Input
            className="rounded-none border-black md:col-span-2"
            value={value.defaultFromEmail}
            onChange={(e) => onChange("defaultFromEmail", e.target.value)}
            placeholder="Email gửi mặc định"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center justify-between border border-black px-3 py-2">
            <span className="font-mono text-[11px] uppercase">Use TLS</span>
            <Checkbox
              checked={!!value.useTLS}
              onCheckedChange={(c) => onChange("useTLS", c === true)}
              className="rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
            />
          </div>
          <div className="flex items-center justify-between border border-black px-3 py-2">
            <span className="font-mono text-[11px] uppercase">Use SSL</span>
            <Checkbox
              checked={!!value.useSSL}
              onCheckedChange={(c) => onChange("useSSL", c === true)}
              className="rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
            />
          </div>
          <div className="flex items-center justify-between border border-black px-3 py-2">
            <span className="font-mono text-[11px] uppercase">
              Notifications
            </span>
            <Checkbox
              checked={!!value.notificationsEnabled}
              onCheckedChange={(c) =>
                onChange("notificationsEnabled", c === true)
              }
              className="rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
            />
          </div>
        </div>

        <Button
          type="button"
          className="rounded-none border border-black bg-white text-black hover:bg-black hover:text-white uppercase font-bold text-xs"
        >
          Test gửi email
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmailSettingsCard;
