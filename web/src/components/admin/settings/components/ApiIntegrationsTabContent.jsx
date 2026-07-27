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
            <Label className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              API Key
            </Label>
            <div className="flex gap-2">
              <div className="flex-1 font-mono text-xs border border-black px-3 py-2 bg-gray-50 select-all">
                {maskedApiKey}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="rounded-none border-black px-3"
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
            <Label className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Webhook URL
            </Label>
            <Input
              className="rounded-none border-black font-mono text-xs"
              value={value.webhookUrl || ""}
              onChange={(e) => onChange("webhookUrl", e.target.value)}
              placeholder="https://your-webhook-endpoint.com/hooks"
            />
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
                className="flex items-center justify-between border border-gray-200 px-4 py-3 hover:border-black transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold uppercase tracking-wide">
                    {integration.name}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-none font-mono text-[9px] uppercase",
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
                  className="text-muted-foreground hover:text-black transition-colors"
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
