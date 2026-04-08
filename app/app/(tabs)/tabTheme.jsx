import { TOKENS } from "../../src/constants/design-tokens";

const STITCH = {
  background: "#F7F9FB",
  surface: "#FFFFFF",
  surfaceMuted: "#F2F4F6",
  border: "rgba(116,119,124,0.2)",
  borderStrong: "rgba(16,30,44,0.24)",
  text: "#191C1E",
  textMuted: "#54647A",
  textSoft: "#74777C",
  primary: "#101E2C",
  primarySoft: "#D5E4F7",
  primaryTint: "rgba(16,30,44,0.08)",
};

export const TAB_THEME = {
  background: STITCH.background,
  surface: STITCH.surface,
  surfaceMuted: STITCH.surfaceMuted,
  border: STITCH.border,
  borderStrong: STITCH.borderStrong,
  text: STITCH.text,
  textMuted: STITCH.textMuted,
  textSoft: STITCH.textSoft,
  primary: STITCH.primary,
  primarySoft: STITCH.primarySoft,
  primaryTint: STITCH.primaryTint,
  successSoft: "rgba(16, 185, 129, 0.12)",
  warningSoft: "rgba(245, 158, 11, 0.14)",
  errorSoft: "rgba(239, 68, 68, 0.12)",
};

export const TAB_SCREEN_PADDING = TOKENS.space[6];
export const TAB_CARD_RADIUS = TOKENS.radius["3xl"];

export default function TabThemeRoute() {
  return null;
}
