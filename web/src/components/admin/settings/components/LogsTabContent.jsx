import { Badge, Button } from "@/components/ui";
import {
  Activity,
  AlertTriangle,
  Clock,
  RefreshCw,
  Server,
} from "lucide-react";
import SettingsSection from "@/components/settings/SettingsSection";
import { cn } from "@/lib/utils";
import { useSystemLogs, useSystemHealth } from "@/hooks/queries/useSettingsQueries";

const LOG_LEVEL_COLORS = {
  error: "border-red-300 text-red-600 bg-red-50",
  warn: "border-yellow-300 text-yellow-600 bg-yellow-50",
  info: "border-blue-300 text-blue-600 bg-blue-50",
  debug: "border-gray-300 text-gray-600 bg-gray-50",
};

const LogsTabContent = ({ logs }) => {
  const { data: logsResponse, refetch: refetchLogs } = useSystemLogs({
    limit: 50,
  });
  const { data: healthResponse, refetch: refetchHealth } = useSystemHealth();

  const recentLogs = logsResponse?.data || logs?.recentLogs || [];
  const health = healthResponse?.data || {};
  const errorCount =
    health.errorCount ?? logs?.errorCount ?? recentLogs.filter(
      (l) => l.level === "error"
    ).length;
  const uptime = health.uptime || logs?.uptime || "N/A";

  return (
    <div className="space-y-8">
      <SettingsSection
        title="Trạng thái hệ thống"
        description="Giám sát tình trạng hoạt động"
      >
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-black/30 bg-white p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Server className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase">Uptime</span>
            </div>
            <p className="font-mono text-2xl font-bold">{uptime}</p>
          </div>
          <div className="rounded-xl border border-black/30 bg-white p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-mono text-[10px] uppercase">Lỗi</span>
            </div>
            <p
              className={cn(
                "font-mono text-2xl font-bold",
                errorCount > 0 ? "text-red-600" : "text-green-600"
              )}
            >
              {errorCount}
            </p>
          </div>
          <div className="rounded-xl border border-black/30 bg-white p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase">
                Trạng thái
              </span>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-2 py-0.5 text-xs uppercase",
                health.status === "healthy"
                  ? "border-green-300 text-green-600 bg-green-50"
                  : "border-yellow-300 text-yellow-600 bg-yellow-50"
              )}
            >
              {health.status === "healthy" ? "Hoạt động" : "Cảnh báo"}
            </Badge>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Nhật ký gần đây"
        description="50 sự kiện mới nhất trong hệ thống"
      >
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchLogs();
              refetchHealth();
            }}
            className="rounded-xl border-black/30 text-sm"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Làm mới
          </Button>
        </div>

        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {recentLogs.length === 0 ? (
            <div className="border border-dashed border-gray-200 p-8 text-center">
              <p className="font-mono text-xs text-muted-foreground uppercase">
                Chưa có nhật ký
              </p>
            </div>
          ) : (
            recentLogs.map((log, index) => (
              <div
                key={log.id || index}
                className="rounded-xl border border-zinc-200 px-3 py-3 transition-colors hover:border-zinc-400"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs uppercase",
                      LOG_LEVEL_COLORS[log.level] || LOG_LEVEL_COLORS.info
                    )}
                  >
                    {log.level?.toUpperCase() || "INFO"}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {log.timestamp
                      ? new Date(log.timestamp).toLocaleString("vi-VN")
                      : "N/A"}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-gray-700">
                  {log.message || "No message"}
                </p>
              </div>
            ))
          )}
        </div>
      </SettingsSection>
    </div>
  );
};

export default LogsTabContent;
