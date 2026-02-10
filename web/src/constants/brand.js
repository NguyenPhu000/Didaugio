/**
 * BRAND & THEME CONSTANTS
 * Centralized brand colors and theme values
 * Note: Tailwind config uses CSS variables for primary/secondary etc.
 * These are for inline styles (e.g. Chart.js, dynamic style objects).
 */

// Brand colors (hex values for JS-side usage: Chart.js, canvas, dynamic styles)
export const BRAND_COLORS = {
  PRIMARY: "#F3E600", // T.I.M Yellow
  PRIMARY_RGB: "243, 230, 0",
  DARK: "#1A1A1A", // Dark background
  DARK_ALT: "#141414", // Darker variant
  BLACK: "#000000",
  WHITE: "#FFFFFF",
};

// Chart.js specific theme (uses raw hex since Chart.js doesn't support Tailwind)
export const CHART_THEME = {
  // Tooltip
  tooltip: {
    backgroundColor: BRAND_COLORS.BLACK,
    titleColor: BRAND_COLORS.PRIMARY,
    bodyColor: BRAND_COLORS.WHITE,
    borderColor: BRAND_COLORS.PRIMARY,
    borderWidth: 2,
    padding: 12,
    titleFont: { family: "monospace", size: 12, weight: "bold" },
    bodyFont: { family: "monospace", size: 11 },
  },

  // Legend
  legend: {
    font: { family: "monospace", size: 10, weight: "bold" },
    color: BRAND_COLORS.BLACK,
    usePointStyle: true,
    padding: 15,
  },

  // Scales
  scales: {
    yAxis: {
      grid: { color: "rgba(0, 0, 0, 0.1)", lineWidth: 1 },
      ticks: { font: { family: "monospace", size: 10 }, color: "#666" },
      border: { color: BRAND_COLORS.BLACK, width: 2 },
    },
    xAxis: {
      grid: { display: false },
      ticks: {
        font: { family: "monospace", size: 10, weight: "bold" },
        color: BRAND_COLORS.BLACK,
      },
      border: { color: BRAND_COLORS.BLACK, width: 2 },
    },
  },

  // Dataset colors
  datasets: {
    primary: {
      borderColor: BRAND_COLORS.PRIMARY,
      backgroundColor: `rgba(${BRAND_COLORS.PRIMARY_RGB}, 0.1)`,
      pointBackgroundColor: BRAND_COLORS.PRIMARY,
      pointBorderColor: BRAND_COLORS.BLACK,
    },
    secondary: {
      borderColor: BRAND_COLORS.BLACK,
      backgroundColor: "rgba(0, 0, 0, 0.05)",
      pointBackgroundColor: BRAND_COLORS.BLACK,
      pointBorderColor: BRAND_COLORS.PRIMARY,
    },
  },

  // Status colors for pie/doughnut charts
  statusColors: {
    approved: BRAND_COLORS.PRIMARY,
    pending: "#fbbf24",
    rejected: "#ef4444",
  },
};

// App metadata
export const APP_META = {
  NAME: "Di Dau Gio",
  FULL_NAME: "DI DAU GIO?",
  ADMIN_SUBTITLE: "ADMIN TERMINAL",
  HEADER_BADGE: "ADM-CORE",
  COPYRIGHT: `© ${new Date().getFullYear()} CAN THO SMART TOURISM`,
  SUPPORT_EMAIL: "support@didaugio.com",
};
