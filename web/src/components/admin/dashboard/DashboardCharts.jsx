import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  getActivityChartData,
  activityChartOptions,
  getPlaceStatusData,
  placeStatusOptions,
  getCategoryBarData,
  categoryBarOptions,
} from "./dashboardChartConfigs";
import DashboardSystemHealth from "./DashboardSystemHealth";
import { useTranslation } from "react-i18next";

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

/**
 * DashboardCharts - All chart panels for the dashboard
 */
const DashboardCharts = ({ stats, categories, places }) => {
  const { t } = useTranslation();
  const activityData = getActivityChartData();
  const placeStatusData = getPlaceStatusData(stats);
  const categoryBarData = getCategoryBarData(categories, places);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Activity Chart */}
      <ChartPanel title={t("dashboard.charts.activityAnalytics")} subtitle={t("dashboard.charts.weeklyActivity")}>
        <div className="p-6 h-[350px]">
          <Line data={activityData} options={activityChartOptions} />
        </div>
      </ChartPanel>

      {/* Place Status Doughnut Chart */}
      <ChartPanel
        title={t("dashboard.charts.statusDistribution")}
        subtitle={t("dashboard.charts.placeStatusBreakdown")}
      >
        <div className="p-6 h-[350px] flex items-center justify-center">
          <Doughnut data={placeStatusData} options={placeStatusOptions} />
        </div>
      </ChartPanel>

      {/* Category Distribution Bar Chart */}
      <ChartPanel title={t("dashboard.charts.categoryMetrics")} subtitle={t("dashboard.charts.categoryStats")}>
        <div className="p-6 h-[350px]">
          <Bar data={categoryBarData} options={categoryBarOptions} />
        </div>
      </ChartPanel>

      {/* System Health Monitor */}
      <ChartPanel title={t("dashboard.charts.systemHealth")} subtitle={t("dashboard.charts.realtimeMonitoring")}>
        <DashboardSystemHealth />
      </ChartPanel>
    </div>
  );
};

export default DashboardCharts;
