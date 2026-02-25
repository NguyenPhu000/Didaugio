import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import ArrowDownRight from "lucide-react/dist/esm/icons/arrow-down-right";
import Minus from "lucide-react/dist/esm/icons/minus";

const ACCENT_COLORS = {
  positive: "bg-emerald-500",
  negative: "bg-red-500",
  neutral: "bg-gray-400",
  warning: "bg-yellow-500",
  primary: "bg-primary",
};

const TREND_COLORS = {
  positive: "text-emerald-600 bg-emerald-50 border-emerald-200",
  negative: "text-red-500 bg-red-50 border-red-200",
  neutral: "text-gray-500 bg-gray-50 border-gray-200",
  warning: "text-yellow-600 bg-yellow-50 border-yellow-200",
  primary: "text-foreground bg-gray-50 border-gray-200",
};

const ICON_COLORS = {
  positive:
    "bg-emerald-50 border-emerald-200 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white",
  negative:
    "bg-red-50 border-red-200 text-red-500 group-hover:bg-red-500 group-hover:text-white",
  neutral:
    "bg-gray-50 border-gray-200 text-gray-500 group-hover:bg-gray-800 group-hover:text-white",
  warning:
    "bg-yellow-50 border-yellow-200 text-yellow-600 group-hover:bg-yellow-400 group-hover:text-black",
  primary:
    "bg-primary/10 border-primary/20 text-primary group-hover:bg-primary group-hover:text-black",
};

const TimStatsCard = ({
  label,
  value,
  icon: Icon,
  subValue,
  subLabel,
  status = "neutral",
  serial,
}) => (
  <div className="relative bg-white border border-black group hover:shadow-hard transition-all duration-300 overflow-hidden">
    {/* Top accent bar */}
    <div className={`h-1 w-full ${ACCENT_COLORS[status]}`} />

    {/* Serial badge */}
    <div className="absolute top-3 right-3 tim-meta opacity-40">{serial}</div>

    {/* Corner decoration */}
    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary" />
    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

    <div className="p-6">
      <div className="flex justify-between items-start mb-5">
        {/* Icon */}
        <div
          className={`p-2.5 border transition-colors ${ICON_COLORS[status]}`}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Trend badge */}
        <div
          className={`flex items-center gap-1 text-[11px] font-bold border px-1.5 py-0.5 ${TREND_COLORS[status]}`}
        >
          {status === "positive" && <ArrowUpRight className="w-3 h-3" />}
          {status === "negative" && <ArrowDownRight className="w-3 h-3" />}
          {status === "neutral" && <Minus className="w-3 h-3" />}
          {subValue}
          {subLabel && (
            <span className="font-normal opacity-60 ml-0.5">{subLabel}</span>
          )}
        </div>
      </div>

      <h3 className="tim-table-header text-muted-foreground mb-1">{label}</h3>
      <div className="tim-stats text-foreground">{value}</div>
    </div>
  </div>
);

export default TimStatsCard;
