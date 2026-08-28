import { Cpu, Database, HardDrive, Zap, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDashboardOnlineUsers } from "@/hooks/queries/useDashboardQuery";

const barColor = (v) => {
  if (v >= 80) return "bg-rose-500";
  if (v >= 60) return "bg-amber-400";
  return "bg-emerald-500";
};

const textColor = (v) => {
  if (v >= 80) return "text-rose-600";
  if (v >= 60) return "text-amber-600";
  return "text-emerald-600";
};

const HealthBar = ({ icon: _Icon, label, value, unit = "%" }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <_Icon className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-semibold text-slate-700">{label}</span>
      </div>
      <span className={`font-mono text-xs font-bold ${textColor(value)}`}>
        {value}
        {unit}
      </span>
    </div>
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full ${barColor(value)} rounded-full transition-all duration-700`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  </div>
);

const DashboardSystemHealth = () => {
  const { t } = useTranslation();
  const { data: onlineUsersData } = useDashboardOnlineUsers();

  const metrics = [
    { icon: Cpu, label: t("dashboard.systemHealth.cpuUsage"), value: 24 },
    { icon: HardDrive, label: t("dashboard.systemHealth.memory"), value: 68 },
    { icon: Database, label: t("dashboard.systemHealth.databaseLoad"), value: 42 },
    { icon: Zap, label: t("dashboard.systemHealth.apiResponse"), value: 12.5 },
  ];

  const onlineUsers = onlineUsersData?.count ?? 0;
  const allOk = metrics.every((m) => m.value < 80);

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        {metrics.map((m) => (
          <HealthBar key={m.label} {...m} />
        ))}
      </div>

      <div className="pt-5 border-t border-black/[0.04]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1">
              {t("dashboard.systemHealth.usersOnline")}
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <span className="text-2xl font-extrabold font-mono text-slate-950">
                {onlineUsers}
              </span>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold
              ${allOk ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-amber-50 border border-amber-200 text-amber-700"}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${allOk ? "bg-emerald-500" : "bg-amber-500"}`}
              />
              {allOk ? t("dashboard.systemHealth.optimal") : t("dashboard.systemHealth.warning")}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              {t("dashboard.systemHealth.serverStatus")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSystemHealth;
