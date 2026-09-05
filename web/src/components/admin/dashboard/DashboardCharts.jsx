import React from "react";
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
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  getActivityChartData,
  getPlaceStatusData,
  getCategoryBarData,
} from "./dashboardChartConfigs";
import DashboardSystemHealth from "./DashboardSystemHealth";
import { useTranslation } from "react-i18next";

/**
 * ChartPanel - Modern Clean SaaS Card
 */
const ChartPanel = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
    <div className="p-5 sm:p-6 border-b border-black/[0.04] bg-[#FAF9F5]">
      <h3 className="text-sm font-extrabold text-slate-950 tracking-tight">{title}</h3>
      <p className="text-xs text-slate-500 font-medium mt-0.5">
        {subtitle}
      </p>
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-2xl text-xs shadow-xl border border-slate-800">
        {label && <p className="font-bold text-slate-200 mb-1.5">{label}</p>}
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="flex justify-between items-center gap-4 text-slate-300 py-0.5">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color || entry.stroke || "#3b82f6" }}
              />
              {entry.name}:
            </span>
            <span className="font-bold text-white font-mono">{entry.value}</span>
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Activity Chart */}
      <ChartPanel
        title={t("dashboard.charts.activityAnalytics")}
        subtitle={t("dashboard.charts.weeklyActivity")}
      >
        <div className="p-6 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "monospace" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 12 }}
              />
              <Line
                type="monotone"
                name="Người dùng hoạt động"
                dataKey="activeUsers"
                stroke="#0f172a"
                strokeWidth={2.5}
                dot={{ r: 3.5, stroke: "#0f172a", strokeWidth: 1.5, fill: "#ffffff" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                name="Lượt xem"
                dataKey="views"
                stroke="#64748b"
                strokeWidth={2}
                dot={{ r: 3, stroke: "#64748b", strokeWidth: 1.5, fill: "#ffffff" }}
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
                paddingAngle={4}
                dataKey="value"
              >
                {placeStatusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, fontWeight: 600 }}
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
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
                angle={-25}
                textAnchor="end"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "monospace" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                name="Số lượng địa điểm"
                dataKey="count"
                fill="#0f172a"
                radius={[6, 6, 0, 0]}
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
