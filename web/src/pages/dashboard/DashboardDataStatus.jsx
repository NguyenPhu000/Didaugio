import Activity from "lucide-react/dist/esm/icons/activity";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import Archive from "lucide-react/dist/esm/icons/archive";
import Layers from "lucide-react/dist/esm/icons/layers";

/**
 * DashboardDataStatus - System status module showing approved/pending/rejected
 */
const DashboardDataStatus = ({ stats }) => {
  const statusItems = [
    {
      icon: Activity,
      value: stats.approved,
      label: "ĐÃ DUYỆT",
      colorBase: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-700",
      borderColor: "border-green-200",
      hoverBg: "group-hover:bg-green-600",
      hoverText: "group-hover:text-white",
    },
    {
      icon: AlertCircle,
      value: stats.pending,
      label: "CHỜ DUYỆT",
      colorBase: "yellow",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-200",
      hoverBg: "group-hover:bg-yellow-500",
      hoverText: "group-hover:text-black",
    },
    {
      icon: Archive,
      value: stats.rejected,
      label: "ĐÃ HỦY",
      colorBase: "red",
      bgColor: "bg-red-100",
      textColor: "text-red-700",
      borderColor: "border-red-200",
      hoverBg: "group-hover:bg-red-600",
      hoverText: "group-hover:text-white",
    },
  ];

  return (
    <div className="lg:col-span-2 border border-black bg-white p-0 shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-black bg-black text-white">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="font-bold font-mono text-sm uppercase tracking-widest">
            TRẠNG THÁI DỮ LIỆU
          </h3>
        </div>
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
      </div>
      <div className="p-8 grid grid-cols-3 gap-8">
        {statusItems.map((item) => (
          <div
            key={item.label}
            className="text-center space-y-2 group cursor-pointer hover:bg-gray-50 p-4 border border-transparent hover:border-black/10 transition-all"
          >
            <div
              className={`mx-auto w-12 h-12 flex items-center justify-center ${item.bgColor} ${item.textColor} rounded-none border ${item.borderColor} ${item.hoverBg} ${item.hoverText} transition-colors`}
            >
              <item.icon className="h-6 w-6" />
            </div>
            <div className="text-3xl font-black font-technical">
              {item.value}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-black">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardDataStatus;
