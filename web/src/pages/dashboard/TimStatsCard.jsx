import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import ArrowDownRight from "lucide-react/dist/esm/icons/arrow-down-right";

/**
 * TimStatsCard - T.I.M Style stat display card
 */
const TimStatsCard = ({
  label,
  value,
  icon: Icon,
  subValue,
  subLabel,
  status = "neutral",
  serial,
}) => {
  const colors = {
    positive: "text-green-600",
    negative: "text-red-500",
    neutral: "text-gray-400",
    warning: "text-yellow-500",
    primary: "text-foreground",
  };

  return (
    <div className="relative bg-white border border-black p-6 group hover:shadow-hard transition-all duration-300">
      {/* Serial Number */}
      <div className="absolute top-2 right-2 tim-meta">{serial}</div>

      {/* Corner Decor */}
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary"></div>
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>

      <div className="flex justify-between items-start mb-4">
        <div className="bg-gray-50 p-2 border border-gray-100 group-hover:bg-primary group-hover:border-black transition-colors">
          <Icon className="w-5 h-5 text-gray-500 group-hover:text-black" />
        </div>
        <div
          className={`flex items-center gap-1 tim-meta font-bold ${colors[status]}`}
        >
          {subValue}
          {status === "positive" && <ArrowUpRight className="w-3 h-3" />}
          {status === "negative" && <ArrowDownRight className="w-3 h-3" />}
          {subLabel && <span className="text-gray-400 ml-1">/ {subLabel}</span>}
        </div>
      </div>

      <div>
        <h3 className="tim-table-header text-muted-foreground mb-1">{label}</h3>
        <div className="tim-stats text-foreground">{value}</div>
      </div>
    </div>
  );
};

export default TimStatsCard;
