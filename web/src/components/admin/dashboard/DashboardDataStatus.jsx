import { Activity, AlertCircle, Archive, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";

const StatusRow = ({ icon: _Icon, value, label, pct, barColor, iconClass }) => (
  <div className="group flex items-center gap-4 p-4 border-b border-black/[0.04] last:border-0 hover:bg-slate-50/80 transition-colors cursor-default">
    <div
      className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors ${iconClass}`}
    >
      <_Icon className="h-4 w-4" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-700">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-extrabold font-mono text-sm text-slate-950 leading-none">
            {value}
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {pct}%
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  </div>
);

const DashboardDataStatus = ({ stats }) => {
  const { t } = useTranslation();
  const total = stats.total || 1;

  const items = [
    {
      icon: Activity,
      value: stats.approved,
      label: t("dashboard.dataStatus.approved"),
      pct: Math.round((stats.approved / total) * 100),
      barColor: "bg-emerald-500",
      iconClass:
        "bg-emerald-50 border-emerald-200 text-emerald-600",
    },
    {
      icon: AlertCircle,
      value: stats.pending,
      label: t("dashboard.dataStatus.pending"),
      pct: Math.round((stats.pending / total) * 100),
      barColor: "bg-amber-400",
      iconClass:
        "bg-amber-50 border-amber-200 text-amber-600",
    },
    {
      icon: Archive,
      value: stats.rejected,
      label: t("dashboard.dataStatus.cancelled"),
      pct: Math.round((stats.rejected / total) * 100),
      barColor: "bg-rose-500",
      iconClass:
        "bg-rose-50 border-rose-200 text-rose-600",
    },
  ];

  return (
    <div className="lg:col-span-2 rounded-3xl border border-black/[0.04] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.04] bg-[#FAF9F5] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <h3 className="font-extrabold text-sm text-slate-950 tracking-tight">
            {t("dashboard.dataStatus.title")}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>{t("dashboard.dataStatus.totalPlaces")}:</span>
          <span className="font-mono font-bold text-slate-900 text-sm">{stats.total}</span>
        </div>
      </div>

      <div className="flex-1">
        {items.map((item) => (
          <StatusRow key={item.label} {...item} />
        ))}
      </div>

      {stats.featured > 0 && (
        <div className="px-6 py-3 border-t border-black/[0.04] bg-slate-50/50 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600">{t("dashboard.dataStatus.featured")}</span>
          <span className="font-bold font-mono text-xs text-slate-900">
            {stats.featured}
          </span>
        </div>
      )}
    </div>
  );
};

export default DashboardDataStatus;
