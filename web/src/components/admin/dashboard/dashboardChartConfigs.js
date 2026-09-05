/**
 * DASHBOARD CHART CONFIGURATIONS
 * Formatted for Recharts rendering
 */
import { BRAND_COLORS, CHART_THEME } from "@/constants/brand";

/**
 * Activity line chart data (weekly users & views)
 */
export const getActivityChartData = () => [
  { day: "T2", activeUsers: 65, views: 45 },
  { day: "T3", activeUsers: 78, views: 62 },
  { day: "T4", activeUsers: 90, views: 70 },
  { day: "T5", activeUsers: 81, views: 65 },
  { day: "T6", activeUsers: 96, views: 78 },
  { day: "T7", activeUsers: 85, views: 72 },
  { day: "CN", activeUsers: 70, views: 55 },
];

/**
 * Place status doughnut chart data
 */
export const getPlaceStatusData = (stats = {}) => [
  {
    name: "ĐÃ DUYỆT",
    value: stats.approved || 0,
    color: CHART_THEME.statusColors.approved,
  },
  {
    name: "CHỜ DUYỆT",
    value: stats.pending || 0,
    color: CHART_THEME.statusColors.pending,
  },
  {
    name: "ĐÃ HỦY",
    value: stats.rejected || 0,
    color: CHART_THEME.statusColors.rejected,
  },
];

/**
 * Category bar chart data
 */
export const getCategoryBarData = (categories = [], places = []) =>
  categories.slice(0, 6).map((cat) => ({
    name: cat.name ? cat.name.toUpperCase().substring(0, 10) : "",
    count: places.filter((p) => p.categoryId === cat.id).length,
  }));
