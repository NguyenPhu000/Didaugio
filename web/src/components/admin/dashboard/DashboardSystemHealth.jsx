import { useState } from "react";
import Cpu from "lucide-react/dist/esm/icons/cpu";
import Database from "lucide-react/dist/esm/icons/database";
import HardDrive from "lucide-react/dist/esm/icons/hard-drive";
import Zap from "lucide-react/dist/esm/icons/zap";
import Users from "lucide-react/dist/esm/icons/users";
import { useTranslation } from "react-i18next";

const barColor = (v) => {
  if (v >= 80) return "bg-red-500";
  if (v >= 60) return "bg-yellow-400";
  return "bg-emerald-500";
};

const textColor = (v) => {
  if (v >= 80) return "text-red-500";
  if (v >= 60) return "text-yellow-500";
  return "text-emerald-600";
};

const HealthBar = ({ icon: _Icon, label, value, unit = "%" }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <_Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="tim-meta">{label}</span>
      </div>
      <span className={`font-mono text-sm font-black ${textColor(value)}`}>
        {value}
        {unit}
      </span>
    </div>
    <div className="h-2 bg-gray-100 border border-gray-200 overflow-hidden">
      <div
        className={`h-full ${barColor(value)} transition-all duration-700`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  </div>
);

const DashboardSystemHealth = () => {
  const { t } = useTranslation();

  const metrics = [
    { icon: Cpu, label: t("dashboard.systemHealth.cpuUsage"), value: 24 },
    { icon: HardDrive, label: t("dashboard.systemHealth.memory"), value: 68 },
    { icon: Database, label: t("dashboard.systemHealth.databaseLoad"), value: 42 },
    { icon: Zap, label: t("dashboard.systemHealth.apiResponse"), value: 12.5 },
  ];

  const [onlineUsers] = useState(() => Math.floor(Math.random() * 50) + 10);
  const allOk = metrics.every((m) => m.value < 80);

  return (
    <div className="p-6 space-y-5">
      {metrics.map((m) => (
        <HealthBar key={m.label} {...m} />
      ))}

      <div className="pt-4 border-t border-dashed border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="tim-meta mb-1">{t("dashboard.systemHealth.usersOnline")}</div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-black font-mono">
                {onlineUsers}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`inline-flex items-center gap-1.5 px-2 py-1 border text-[10px] font-mono font-bold uppercase
              ${allOk ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-yellow-50 border-yellow-200 text-yellow-700"}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${allOk ? "bg-emerald-500" : "bg-yellow-500"}`}
              />
              {allOk ? t("dashboard.systemHealth.optimal") : t("dashboard.systemHealth.warning")}
            </div>
            <div className="tim-meta mt-1">{t("dashboard.systemHealth.serverStatus")}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSystemHealth;
