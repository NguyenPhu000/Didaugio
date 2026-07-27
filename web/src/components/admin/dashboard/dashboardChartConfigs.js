/**
 * DASHBOARD CHART CONFIGURATIONS
 * Extracted from DashboardPage to keep chart configs separate from UI logic
 */
import { BRAND_COLORS, CHART_THEME } from "@/constants/brand";

/**
 * Activity line chart (weekly users & views)
 */
export const getActivityChartData = () => ({
  labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
  datasets: [
    {
      label: "NGƯỜI DÙNG HOẠT ĐỘNG",
      data: [65, 78, 90, 81, 96, 85, 70],
      ...CHART_THEME.datasets.primary,
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
    },
    {
      label: "LƯỢT XEM",
      data: [45, 62, 70, 65, 78, 72, 55],
      ...CHART_THEME.datasets.secondary,
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    },
  ],
});

export const activityChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: "top",
      labels: CHART_THEME.legend,
    },
    tooltip: CHART_THEME.tooltip,
  },
  scales: {
    y: {
      beginAtZero: true,
      ...CHART_THEME.scales.yAxis,
    },
    x: {
      ...CHART_THEME.scales.xAxis,
    },
  },
};

/**
 * Place status doughnut chart
 */
export const getPlaceStatusData = (stats) => ({
  labels: ["ĐÃ DUYỆT", "CHỜ DUYỆT", "ĐÃ HỦY"],
  datasets: [
    {
      data: [stats.approved, stats.pending, stats.rejected],
      backgroundColor: [
        CHART_THEME.statusColors.approved,
        CHART_THEME.statusColors.pending,
        CHART_THEME.statusColors.rejected,
      ],
      borderColor: [BRAND_COLORS.BLACK, BRAND_COLORS.BLACK, BRAND_COLORS.BLACK],
      borderWidth: 3,
      hoverBorderWidth: 4,
      hoverBorderColor: BRAND_COLORS.PRIMARY,
    },
  ],
});

export const placeStatusOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: CHART_THEME.legend,
    },
    tooltip: CHART_THEME.tooltip,
  },
};

/**
 * Category bar chart
 */
export const getCategoryBarData = (categories, places) => ({
  labels: categories
    .slice(0, 6)
    .map((c) => c.name.toUpperCase().substring(0, 10)),
  datasets: [
    {
      label: "SỐ LƯỢNG ĐỊA ĐIỂM",
      data: categories
        .slice(0, 6)
        .map((cat) => places.filter((p) => p.categoryId === cat.id).length),
      backgroundColor: BRAND_COLORS.PRIMARY,
      borderColor: BRAND_COLORS.BLACK,
      borderWidth: 2,
      hoverBackgroundColor: BRAND_COLORS.BLACK,
      hoverBorderColor: BRAND_COLORS.PRIMARY,
      hoverBorderWidth: 3,
    },
  ],
});

export const categoryBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: CHART_THEME.tooltip,
  },
  scales: {
    y: {
      beginAtZero: true,
      ...CHART_THEME.scales.yAxis,
    },
    x: {
      ...CHART_THEME.scales.xAxis,
      ticks: {
        ...CHART_THEME.scales.xAxis.ticks,
        font: { family: "monospace", size: 9, weight: "bold" },
        maxRotation: 45,
        minRotation: 45,
      },
    },
  },
};
