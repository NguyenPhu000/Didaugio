import { BRAND_COLORS } from "@/constants/brand";

/**
 * DashboardSystemHealth - Real-time system health monitor panel
 */

const HealthBar = ({ label, value, color }) => (
  <div>
    <div className="flex justify-between mb-2">
      <span className="tim-meta">{label}</span>
      <span className="font-mono text-sm font-black">{value}%</span>
    </div>
    <div className="h-3 bg-gray-200 border border-black">
      <div
        className={`h-full ${color} transition-all duration-500`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const DashboardSystemHealth = () => {
  // These would come from a real monitoring API in production
  const metrics = [
    { label: "CPU USAGE", value: 24, color: "bg-tim-yellow" },
    { label: "MEMORY", value: 68, color: "bg-yellow-500" },
    { label: "DATABASE LOAD", value: 42, color: "bg-green-500" },
    { label: "API RESPONSE", value: 12.5, color: "bg-blue-500" },
  ];

  return (
    <div className="p-6 space-y-4">
      {metrics.map((metric) => (
        <HealthBar key={metric.label} {...metric} />
      ))}

      {/* Online Users */}
      <div className="pt-4 border-t-2 border-black mt-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="tim-meta">USERS ONLINE</span>
            <div className="text-3xl font-black font-mono mt-1">
              {Math.floor(Math.random() * 50) + 10}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-mono uppercase">ACTIVE</span>
            </div>
            <span className="text-xs text-gray-500 font-mono">NO OVERLOAD</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSystemHealth;
