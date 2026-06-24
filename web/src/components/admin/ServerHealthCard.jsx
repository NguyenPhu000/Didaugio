import { useDashboardHealth } from "@/hooks/queries/useDashboardQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import Activity from "lucide-react/dist/esm/icons/activity";
import Database from "lucide-react/dist/esm/icons/database";
import Cpu from "lucide-react/dist/esm/icons/cpu";
import HardDrive from "lucide-react/dist/esm/icons/hard-drive";
import Clock from "lucide-react/dist/esm/icons/clock";

const STATUS_MAP = {
  healthy: { label: "Khỏe mạnh", color: "bg-green-50 text-green-700 border-green-200" },
  operational: { label: "Hoạt động", color: "bg-green-50 text-green-700 border-green-200" },
  warning: { label: "Cảnh báo", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  critical: { label: "Nghiêm trọng", color: "bg-red-50 text-red-700 border-red-200" },
};

const formatUptime = (seconds) => {
  if (!seconds) return "0s";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const MetricRow = ({ icon: Icon, label, value, extra }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-4 w-4" />
      {label}
    </div>
    <div className="text-sm font-medium">
      {value}
      {extra && <span className="text-xs text-muted-foreground ml-1">{extra}</span>}
    </div>
  </div>
);

export default function ServerHealthCard() {
  const { data, isLoading } = useDashboardHealth();

  const payload = data?.success === true ? data.data : data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const server = payload?.server;
  const database = payload?.database;
  const apiStatus = payload?.api?.status;

  const dbStatusInfo = STATUS_MAP[database?.status] || STATUS_MAP.healthy;
  const apiStatusInfo = STATUS_MAP[apiStatus] || STATUS_MAP.operational;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-500" />
          Tình trạng hệ thống
        </CardTitle>
        <Badge variant="outline" className={apiStatusInfo.color}>
          {apiStatusInfo.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-1">
        {server && (
          <>
            <MetricRow
              icon={Clock}
              label="Uptime"
              value={formatUptime(server.uptime)}
            />
            <MetricRow
              icon={Cpu}
              label="Node.js"
              value={server.nodeVersion}
              extra={`PID ${server.pid}`}
            />
            <MetricRow
              icon={HardDrive}
              label="Memory (RSS)"
              value={`${server.memory.rss} MB`}
              extra={`/ Heap ${server.memory.heapUsed}/${server.memory.heapTotal} MB`}
            />
          </>
        )}

        {database && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Database className="h-4 w-4" />
                Database
              </div>
              <Badge variant="outline" className={dbStatusInfo.color}>
                {dbStatusInfo.label}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={database.load} className="flex-1" />
              <span className="text-xs text-muted-foreground w-12 text-right">
                {database.load}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {database.totalRecords?.toLocaleString()} bản ghi
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
