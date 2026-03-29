/**
 * design-tokens.js — single source of truth for the mobile design system.
 * Use these values in StyleSheet/native styles and expose them to NativeWind.
 */

const MODERN_BLUE = {
  50: "#F0F9FF",
  100: "#E0F2FE",
  200: "#BAE6FD",
  300: "#7DD3FC",
  400: "#38BDF8",
  500: "#0EA5E9",
  600: "#0284C8",
  700: "#0369A1",
  800: "#075985",
  900: "#0C4A6E",
};

const SLATE = {
  0: "#FFFFFF",
  50: "#F8FAFC",
  100: "#F1F5F9",
  200: "#E2E8F0",
  300: "#CBD5E1",
  400: "#94A3B8",
  500: "#64748B",
  700: "#334155",
  800: "#1E293B",
  900: "#0F172A",
};

export const TOKENS = {
  color: {
    primary: MODERN_BLUE,
    accent: {
      400: "#7DD3FC",
      500: "#0284C8",
      600: "#0369A1",
    },
    neutral: SLATE,
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
    surface: {
      light: "#FFFFFF",
      dark: "#111827",
      elevatedLight: "rgba(255,255,255,0.96)",
      elevatedDark: "#172033",
    },
    background: {
      light: "#F8FAFC",
      dark: "#020617",
      tintLight: "#E0F2FE",
      tintDark: "#0F172A",
    },
    card: {
      light: "#FFFFFF",
      dark: "#172033",
    },
    border: {
      light: "#E2E8F0",
      dark: "#243041",
      strong: "#BAE6FD",
    },
    overlay: {
      soft: "rgba(15, 23, 42, 0.08)",
      strong: "rgba(15, 23, 42, 0.72)",
      blue: "rgba(2, 132, 200, 0.14)",
    },
  },

  font: {
    heading: "BeVietnamPro_700Bold",
    body: "BeVietnamPro_400Regular",
    medium: "BeVietnamPro_500Medium",
    semibold: "BeVietnamPro_600SemiBold",
  },

  fontSize: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    "2xl": 20,
    "3xl": 24,
    "4xl": 28,
    "5xl": 34,
  },

  space: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
  },

  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 22,
    "2xl": 28,
    "3xl": 32,
    full: 9999,
  },

  shadow: {
    sm: {
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    md: {
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 22,
      elevation: 6,
    },
    lg: {
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.12,
      shadowRadius: 30,
      elevation: 12,
    },
    glow: {
      shadowColor: "#0284C8",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.28,
      shadowRadius: 24,
      elevation: 12,
    },
  },

  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
    xslow: 600,
  },
};

export const GLASS_THEME = {
  background: "#05070B",
  backgroundElevated: "#111111",
  glass: "rgba(255,255,255,0.08)",
  glassBorder: "rgba(255,255,255,0.12)",
  glassBorderStrong: "rgba(255,255,255,0.22)",
  neon: "#00F0FF",
  neonAccent: "#C084FC",
  neonGlow: "rgba(0,240,255,0.12)",
  text: "#FFFFFF",
  textSecondary: "#A3A3A3",
  shadow: {
    glass: {
      shadowColor: "#00F0FF",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 12,
    },
    neon: {
      shadowColor: "#00F0FF",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 30,
      elevation: 20,
    },
  },
};

export const CATEGORY_COLORS = {
  "an-uong": "#F97316",
  "du-lich": "#0EA5E9",
  "vui-choi": "#22C55E",
  "mua-sam": "#EC4899",
  "van-hoa": "#8B5CF6",
  "thien-nhien": "#14B8A6",
  default: "#94A3B8",
};
