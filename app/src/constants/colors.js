import { TOKENS } from "./design-tokens";

export const COLORS = {
  primary: TOKENS.color.primary[500],
  primaryDark: TOKENS.color.primary[700],
  primaryLight: TOKENS.color.primary[100],
  accent: TOKENS.color.accent[500],

  background: TOKENS.color.background.light,
  backgroundTint: TOKENS.color.background.tintLight,
  surface: TOKENS.color.surface.light,
  surfaceElevated: TOKENS.color.surface.elevatedLight,
  border: TOKENS.color.border.light,
  borderStrong: TOKENS.color.border.strong,
  divider: TOKENS.color.neutral[100],

  text: TOKENS.color.neutral[900],
  textSecondary: TOKENS.color.neutral[500],
  textMuted: TOKENS.color.neutral[400],
  textInverse: TOKENS.color.neutral[0],

  success: TOKENS.color.success,
  warning: TOKENS.color.warning,
  error: TOKENS.color.error,
  info: TOKENS.color.info,

  gold: "#F59E0B",
  starFill: "#FBBF24",

  glassBg: "rgba(255,255,255,0.78)",
  glassBorder: "rgba(186,230,253,0.9)",
  glassOverlay: "rgba(14,165,233,0.06)",

  dark: {
    background: TOKENS.color.background.dark,
    surface: TOKENS.color.surface.dark,
    border: TOKENS.color.border.dark,
    text: "#F8FAFC",
    textSecondary: "#94A3B8",
  },
};

export const SPACING = {
  xs: TOKENS.space[1],
  sm: TOKENS.space[2],
  md: TOKENS.space[3],
  lg: TOKENS.space[4],
  xl: TOKENS.space[5],
  "2xl": TOKENS.space[6],
  "3xl": TOKENS.space[8],
  "4xl": TOKENS.space[10],
};

export const RADIUS = {
  sm: TOKENS.radius.sm,
  md: TOKENS.radius.md,
  lg: TOKENS.radius.lg,
  xl: TOKENS.radius.xl,
  "2xl": TOKENS.radius["2xl"],
  "3xl": TOKENS.radius["3xl"],
  full: TOKENS.radius.full,
};

export const FONT_SIZE = {
  xs: TOKENS.fontSize.xs,
  sm: TOKENS.fontSize.sm,
  base: TOKENS.fontSize.base,
  md: TOKENS.fontSize.md,
  lg: TOKENS.fontSize.lg,
  xl: TOKENS.fontSize.xl,
  "2xl": TOKENS.fontSize["2xl"],
  "3xl": TOKENS.fontSize["3xl"],
  "4xl": TOKENS.fontSize["4xl"],
};
