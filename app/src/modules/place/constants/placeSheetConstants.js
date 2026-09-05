/**
 * Design constants for the place detail bottom sheets.
 * Keeps PALETTE, TOKENS and shared helpers co-located so that
 * AllReviewsSheet, ReviewComposerSheet, and the place screen
 * all import from a single source of truth.
 */

import { REVIEW_MEDIA_LIMIT } from "../utils/reviewMedia";
import {
  BOOKING_APPLE_THEME,
  TOKENS as DESIGN_TOKENS,
} from "../../../constants/design-tokens";

const ACTIVE_FONT_FAMILY = "BeVietnamPro";

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

export const PALETTE = {
  bg: BOOKING_APPLE_THEME.white,
  surface: BOOKING_APPLE_THEME.white,
  surfaceAlt: DESIGN_TOKENS.color.semantic.apple.surface,
  heroFallback: DESIGN_TOKENS.color.semantic.slate[200],
  overlayStrong: "rgba(0,0,0,0.45)",
  text: BOOKING_APPLE_THEME.text,
  textMuted: "rgba(0,0,0,0.48)",
  textSoft: "rgba(0,0,0,0.32)",
  primary: BOOKING_APPLE_THEME.primary,
  primaryDark: BOOKING_APPLE_THEME.black,
  primarySoft: "rgba(0,0,0,0.06)",
  border: "rgba(0,0,0,0.12)",
  borderSoft: "rgba(0,0,0,0.06)",
  success: DESIGN_TOKENS.color.semantic.success,
  warning: DESIGN_TOKENS.color.semantic.warning,
  accent: DESIGN_TOKENS.color.semantic.info,
};

export const PLACE_SHEET_BACKGROUND = {
  backgroundColor: PALETTE.surface,
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  borderWidth: 1,
  borderColor: PALETTE.border,
};

export const PLACE_SHEET_INDICATOR = {
  backgroundColor: "rgba(0, 0, 0, 0.18)",
  width: 36,
};

export const TOKENS = {
  font: {
    heading: ACTIVE_FONTS.heading,
    body: ACTIVE_FONTS.body,
    medium: ACTIVE_FONTS.medium,
    semibold: ACTIVE_FONTS.semibold,
  },
};

export const REVIEW_FILTER_RATINGS = [5, 4, 3, 2, 1];

export { REVIEW_MEDIA_LIMIT };

/**
 * Format a review count into a human-readable bilingual string.
 * @param {number} count
 * @param {(key: string, params?: object) => string} t – i18next translation helper
 * @returns {string}
 */
export function formatReviewCount(count, t) {
  const n = Number(count) || 0;
  if (n === 0) return t("place.detail.noReviewsShort");
  if (n === 1) return t("place.detail.oneReview");
  return t("place.detail.manyReviews", { count: n });
}
