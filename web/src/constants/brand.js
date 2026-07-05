export const BRAND_COLORS = {
  PRIMARY: "#F3E600", // T.I.M Yellow
  PRIMARY_RGB: "243, 230, 0",
  DARK: "#1A1A1A", // Dark background
  DARK_ALT: "#141414", // Darker variant
  BLACK: "#000000",
  WHITE: "#FFFFFF",
};

export const CHART_THEME = {
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

  legend: {
    font: { family: "monospace", size: 10, weight: "bold" },
    color: BRAND_COLORS.BLACK,
    usePointStyle: true,
    padding: 15,
  },

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

  statusColors: {
    approved: BRAND_COLORS.PRIMARY,
    pending: "#fbbf24",
    rejected: "#ef4444",
  },
};

export const APP_META = {
  NAME: "iPoint Genie",
  FULL_NAME: "iPoint Genie",
  ADMIN_SUBTITLE: "ADMIN TERMINAL",
  HEADER_BADGE: "ADM-CORE",
  COPYRIGHT: `© ${new Date().getFullYear()} CAN THO SMART TOURISM`,
  SUPPORT_EMAIL: "support@didaugio.com",
};
