/**
 * design-tokens.js — single source of truth for the mobile design system.
 * Based on the provided design system specification.
 * Use these values in StyleSheet/native styles and expose them to NativeWind.
 */

// Design System Colors from specification
const WHITE = "#FFFFFF";
const BLACK = "#181819";
const GREY = "#4C4C50";
const LIGHT_GREY = "#D1E0ED";
const MAIN_ACCENT = "#007BFF";

// Extended color palette based on main accent
const PRIMARY_BLUE = {
  50: "#F0F7FF",
  100: "#E0EEFF",
  200: "#C2DDFF",
  300: "#A3C9FF",
  400: "#85B5FF",
  500: MAIN_ACCENT,
  600: "#0066E6",
  700: "#0055CC",
  800: "#0044B3",
  900: "#003399",
};

// Neutral colors based on specification
const NEUTRAL = {
  0: WHITE,
  50: "#F5F5F5",
  100: LIGHT_GREY,
  200: "#B8C8D6",
  300: "#9EB0BF",
  400: GREY,
  500: "#3A3A3D",
  600: "#2C2C2F",
  700: BLACK,
  800: "#141415",
  900: "#0A0A0B",
};

const ACTIVE_FONT_FAMILY = "Afacad";

const FONT_FAMILIES = {
  BeVietnamPro: {
    heading: "BeVietnamPro_700Bold",
    body: "BeVietnamPro_400Regular",
    medium: "BeVietnamPro_500Medium",
    semibold: "BeVietnamPro_600SemiBold",
  },
  Afacad: {
    heading: "Afacad-Bold",
    body: "Afacad-Regular",
    medium: "Afacad-Medium",
    semibold: "Afacad-SemiBold",
  },
};

const ACTIVE_FONTS = FONT_FAMILIES[ACTIVE_FONT_FAMILY];

export const TOKENS = {
  color: {
    primary: PRIMARY_BLUE,
    accent: {
      400: PRIMARY_BLUE[400],
      500: PRIMARY_BLUE[500],
      600: PRIMARY_BLUE[600],
    },
    // Travel app colors using only blue theme from design system
    travel: {
      ocean: PRIMARY_BLUE[500],
      tropical: PRIMARY_BLUE[400],
      sand: "#FFE5B4",
      forest: "#2D6A4F",
      coral: PRIMARY_BLUE[300],
      gradient: [PRIMARY_BLUE[400], PRIMARY_BLUE[500], PRIMARY_BLUE[600]],
    },
    neutral: NEUTRAL,
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: PRIMARY_BLUE[500],
    surface: {
      light: WHITE,
      dark: BLACK,
      elevatedLight: "rgba(255,255,255,0.98)",
      elevatedDark: "rgba(24,24,25,0.98)",
    },
    background: {
      light: WHITE,
      dark: BLACK,
      tintLight: LIGHT_GREY,
      tintDark: NEUTRAL[800],
      // Gradient backgrounds using new colors
      gradientLight: [WHITE, LIGHT_GREY],
      gradientWarm: ["#FFF5F5", "#FFE5B4"],
    },
    card: {
      light: WHITE,
      dark: BLACK,
      elevatedLight: "rgba(255,255,255,0.98)",
      elevatedDark: "rgba(24,24,25,0.98)",
    },
    border: {
      light: LIGHT_GREY,
      dark: GREY,
      strong: PRIMARY_BLUE[300],
      accent: PRIMARY_BLUE[500],
      soft: "rgba(0,123,255,0.2)",
    },
    overlay: {
      soft: "rgba(24,24,25,0.08)",
      strong: "rgba(24,24,25,0.72)",
      blue: "rgba(0,123,255,0.14)",
      ocean: "rgba(0,123,255,0.12)",
    },
  },

  font: {
    family: ACTIVE_FONT_FAMILY,
    heading: ACTIVE_FONTS.heading,
    body: ACTIVE_FONTS.body,
    medium: ACTIVE_FONTS.medium,
    semibold: ACTIVE_FONTS.semibold,
    headingFallback: "System",
    bodyFallback: "System",
    mediumFallback: "System",
    semiboldFallback: "System",
  },

  getFont: (fontType) => {
    const resolvedFont = ACTIVE_FONTS[fontType] || ACTIVE_FONTS.body;
    return [resolvedFont, "System"];
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
    // Modern rounded corners for cards
    card: 20,
    button: 12,
    pill: 999,
  },

  shadow: {
    sm: {
      shadowColor: BLACK,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    md: {
      shadowColor: BLACK,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 22,
      elevation: 6,
    },
    lg: {
      shadowColor: BLACK,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.12,
      shadowRadius: 30,
      elevation: 12,
    },
    glow: {
      shadowColor: PRIMARY_BLUE[500],
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.28,
      shadowRadius: 24,
      elevation: 12,
    },
    // Blue shadows using new design system
    accent: {
      shadowColor: PRIMARY_BLUE[500],
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
    },
    ocean: {
      shadowColor: PRIMARY_BLUE[500],
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 28,
      elevation: 10,
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
  background: BLACK,
  backgroundElevated: NEUTRAL[600],
  glass: "rgba(255,255,255,0.08)",
  glassBorder: "rgba(255,255,255,0.12)",
  glassBorderStrong: "rgba(255,255,255,0.22)",
  neon: PRIMARY_BLUE[400],
  neonAccent: PRIMARY_BLUE[300],
  neonGlow: "rgba(0,123,255,0.12)",
  text: WHITE,
  textSecondary: NEUTRAL[400],
  shadow: {
    glass: {
      shadowColor: PRIMARY_BLUE[400],
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 12,
    },
    neon: {
      shadowColor: PRIMARY_BLUE[400],
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 30,
      elevation: 20,
    },
  },
};

// Apple-inspired booking theme for booking/profile booking surfaces.
export const BOOKING_APPLE_THEME = {
  background: "#F5F5F7",
  surface: "#FFFFFF",
  surfaceElevated: "#FAFAFC",
  surfaceMuted: "#EDEDF2",
  border: "#D2D2D7",
  borderSoft: "rgba(0,0,0,0.08)",
  primary: "#1D1D1F",
  primaryPressed: "#000000",
  primaryTint: "rgba(0,0,0,0.08)",
  text: "#1D1D1F",
  textSecondary: "rgba(0,0,0,0.8)",
  textMuted: "rgba(0,0,0,0.48)",
  success: "#34C759",
  warning: "#FF9F0A",
  danger: "#FF3B30",
  focusBlue: "#0071E3",
  white: "#FFFFFF",
  black: "#000000",
};

// Backward-compatible alias for earlier import sites.
export const BOOKING_AIRBNB_THEME = BOOKING_APPLE_THEME;

export const CATEGORY_COLORS = {
  "an-uong": "#F97316",
  "du-lich": PRIMARY_BLUE[500],
  "vui-choi": "#22C55E",
  "mua-sam": "#EC4899",
  "van-hoa": "#8B5CF6",
  "thien-nhien": "#14B8A6",
  default: GREY,
};
