import Activity from "lucide-react/dist/esm/icons/activity";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import Archive from "lucide-react/dist/esm/icons/archive";
import Layers from "lucide-react/dist/esm/icons/layers";

const StatusRow = ({ icon: Icon, value, label, pct, barColor, iconClass }) => (
  <div className="group flex items-center gap-4 p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-default">
    <div
      className={`w-10 h-10 flex items-center justify-center rounded-none border transition-colors ${iconClass}`}
    >
      <Icon className="h-5 w-5" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-black font-mono text-lg leading-none">
            {value}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {pct}%
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 border border-gray-200 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  </div>
);

const DashboardDataStatus = ({ stats }) => {
  const total = stats.total || 1;

  const items = [
    {
      icon: Activity,
      value: stats.approved,
      label: "ĐÃ DUYỆT",
      pct: Math.round((stats.approved / total) * 100),
      barColor: "bg-emerald-500",
      iconClass:
        "bg-emerald-50 border-emerald-200 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white",
    },
    {
      icon: AlertCircle,
      value: stats.pending,
      label: "CHỜ DUYỆT",
      pct: Math.round((stats.pending / total) * 100),
      barColor: "bg-yellow-400",
      iconClass:
        "bg-yellow-50 border-yellow-200 text-yellow-600 group-hover:bg-yellow-400 group-hover:text-black",
    },
    {
      icon: Archive,
      value: stats.rejected,
      label: "ĐÃ HỦY",
      pct: Math.round((stats.rejected / total) * 100),
      barColor: "bg-red-500",
      iconClass:
        "bg-red-50 border-red-200 text-red-500 group-hover:bg-red-500 group-hover:text-white",
    },
  ];

  return (
    <div className="lg:col-span-2 border border-black bg-white shadow-sm flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-black bg-black text-white shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="font-bold font-mono text-sm uppercase tracking-widest">
            TRẠNG THÁI DỮ LIỆU
          </h3>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-yellow-400 rounded-full" />
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
        </div>
      </div>

      {/* Total */}
      <div className="px-4 py-3 border-b border-dashed border-gray-200 bg-gray-50">
        <span className="tim-meta">TỔNG SỐ ĐỊA ĐIỂM</span>
        <span className="ml-3 font-black font-mono text-xl">{stats.total}</span>
      </div>

      <div className="flex-1">
        {items.map((item) => (
          <StatusRow key={item.label} {...item} />
        ))}
      </div>

      {stats.featured > 0 && (
        <div className="px-4 py-2.5 border-t border-dashed border-gray-200 bg-primary/5 flex items-center justify-between">
          <span className="tim-meta">NỔI BẬT (FEATURED)</span>
          <span className="font-black font-mono text-sm text-primary">
            {stats.featured}
          </span>
        </div>
      )}
    </div>
  );
};

export default DashboardDataStatus;
