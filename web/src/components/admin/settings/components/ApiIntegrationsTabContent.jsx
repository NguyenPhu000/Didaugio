import { useState } from "react";
import { Input, Label, Button, Badge } from "@/components/ui";
import { Copy, Check, ExternalLink } from "lucide-react";
import SettingsSection from "@/components/settings/SettingsSection";
import { cn } from "@/lib/utils";

const INTEGRATIONS = [
  {
    key: "googleMaps",
    name: "Google Maps",
    docsUrl: "https://console.cloud.google.com/apis/credentials",
  },
  {
    key: "groqAi",
    name: "Groq AI",
    docsUrl: "https://console.groq.com/keys",
  },
  {
    key: "cloudinary",
    name: "Cloudinary",
    docsUrl: "https://console.cloudinary.com/settings/api-keys",
  },
];

const ApiIntegrationsTabContent = ({ value, onChange }) => {
  const [copied, setCopied] = useState(false);

  const maskedApiKey = value.apiKey
    ? `${value.apiKey.slice(0, 8)}${"*".repeat(16)}${value.apiKey.slice(-4)}`
    : "Chưa cấu hình";

  const handleCopy = () => {
    if (value.apiKey) {
      navigator.clipboard.writeText(value.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      <SettingsSection
        title="API Keys & Webhooks"
        description="Quản lý khóa API và cấu hình webhook"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-zinc-800">
              API Key
            </Label>
            <div className="flex gap-2">
              <div className="flex min-h-10 flex-1 items-center rounded-xl border border-black/30 bg-zinc-50 px-3 text-sm text-zinc-700 select-all">
                {maskedApiKey}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                aria-label="Copy API key"
                title="Copy API key"
                className="rounded-xl border-black/30 px-3"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-zinc-800">
              Webhook URL
            </Label>
            <Input
              className="h-10 rounded-xl border-black/30 text-sm"
              value={value.webhookUrl || ""}
              onChange={(e) => onChange("webhookUrl", e.target.value)}
            />
            <p className="text-xs leading-relaxed text-zinc-500">
              Endpoint nhận sự kiện hệ thống từ server.
            </p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Tích hợp bên thứ ba"
        description="Trạng thái kết nối với các dịch vụ bên ngoài"
      >
        <div className="space-y-2">
          {INTEGRATIONS.map((integration) => {
            const status = value[integration.key] || {
              enabled: false,
              configured: false,
            };
            return (
              <div
                key={integration.key}
                className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 px-4 py-3 transition-colors hover:border-black"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-900">
                    {integration.name}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs uppercase",
                      status.configured
                        ? "border-green-300 text-green-600"
                        : "border-gray-300 text-gray-500"
                    )}
                  >
                    {status.configured ? "Đã cấu hình" : "Chưa cấu hình"}
                  </Badge>
                </div>
                <a
                  href={integration.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${integration.name} documentation`}
                  title={`Open ${integration.name} documentation`}
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-zinc-100 hover:text-black"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            );
          })}
        </div>
      </SettingsSection>
    </div>
  );
};

export default ApiIntegrationsTabContent;
