import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  getActivityChartData,
  getPlaceStatusData,
  getCategoryBarData,
} from "./dashboardChartConfigs";
import DashboardSystemHealth from "./DashboardSystemHealth";
import { useTranslation } from "react-i18next";
import { BRAND_COLORS } from "@/constants/brand";

/**
 * ChartPanel - Wrapper with T.I.M style header
 */
const ChartPanel = ({ title, subtitle, children }) => (
  <div className="border-2 border-black bg-white shadow-sm">
    <div className="bg-black text-white p-4 border-b-2 border-black">
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-tim-yellow"></div>
        <div>
          <h3 className="tim-meta text-white mb-1">{title}</h3>
          <p className="text-xs text-gray-400 uppercase font-mono">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black text-white p-2.5 border-2 border-[#F3E600] font-mono text-xs shadow-lg">
        {label && <p className="font-bold text-[#F3E600] mb-1">{label}</p>}
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="flex justify-between gap-3 text-slate-200">
            <span>{entry.name}:</span>
            <span className="font-bold text-white">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * DashboardCharts - All chart panels for the dashboard using Recharts
 */
const DashboardCharts = ({ stats, categories, places }) => {
  const { t } = useTranslation();
  const activityData = getActivityChartData();
  const placeStatusData = getPlaceStatusData(stats);
  const categoryBarData = getCategoryBarData(categories, places);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Activity Chart */}
      <ChartPanel
        title={t("dashboard.charts.activityAnalytics")}
        subtitle={t("dashboard.charts.weeklyActivity")}
      >
        <div className="p-6 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontFamily: "monospace", fontSize: 11, fill: "#000000", fontWeight: "bold" }}
                axisLine={{ stroke: "#000000", strokeWidth: 2 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontFamily: "monospace", fontSize: 11, fill: "#666" }}
                axisLine={{ stroke: "#000000", strokeWidth: 2 }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontFamily: "monospace", fontSize: 11, fontWeight: "bold", paddingTop: 8 }}
              />
              <Line
                type="monotone"
                name="NGƯỜI DÙNG HOẠT ĐỘNG"
                dataKey="activeUsers"
                stroke="#F3E600"
                strokeWidth={3}
                dot={{ r: 4, stroke: "#000000", strokeWidth: 2, fill: "#F3E600" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                name="LƯỢT XEM"
                dataKey="views"
                stroke="#000000"
                strokeWidth={2}
                dot={{ r: 3, stroke: "#F3E600", strokeWidth: 2, fill: "#000000" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartPanel>

      {/* Place Status Doughnut Chart */}
      <ChartPanel
        title={t("dashboard.charts.statusDistribution")}
        subtitle={t("dashboard.charts.placeStatusBreakdown")}
      >
        <div className="p-6 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={placeStatusData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={105}
                paddingAngle={3}
                dataKey="value"
              >
                {placeStatusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="#000000"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontFamily: "monospace", fontSize: 11, fontWeight: "bold" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartPanel>

      {/* Category Distribution Bar Chart */}
      <ChartPanel
        title={t("dashboard.charts.categoryMetrics")}
        subtitle={t("dashboard.charts.categoryStats")}
      >
        <div className="p-6 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontFamily: "monospace", fontSize: 10, fill: "#000000", fontWeight: "bold" }}
                axisLine={{ stroke: "#000000", strokeWidth: 2 }}
                tickLine={false}
                angle={-30}
                textAnchor="end"
              />
              <YAxis
                tick={{ fontFamily: "monospace", fontSize: 11, fill: "#666" }}
                axisLine={{ stroke: "#000000", strokeWidth: 2 }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                name="SỐ LƯỢNG ĐỊA ĐIỂM"
                dataKey="count"
                fill={BRAND_COLORS.PRIMARY}
                stroke="#000000"
                strokeWidth={2}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartPanel>

      {/* System Health Monitor */}
      <ChartPanel
        title={t("dashboard.charts.systemHealth")}
        subtitle={t("dashboard.charts.realtimeMonitoring")}
      >
        <DashboardSystemHealth />
      </ChartPanel>
    </div>
  );
};

export default DashboardCharts;
